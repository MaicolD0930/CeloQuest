# CeloQuest Smart Contracts

Life recovery payments on **Celo Sepolia** (testnet) and **Celo Mainnet** (production).

| Contract | Purpose |
|----------|---------|
| `TCOPM.sol` | Test ERC-20 token (tCOPM) — replace with cCOPM on mainnet |
| `RecoveryPaymentContract.sol` | Multi-token recovery payments (tCOPM + USDC) |

---

## Architecture

```
Usuario → approve(RecoveryPaymentContract) → purchaseRecovery(token)
                ↓
     RecoveryPaymentContract transfiere fondos → Treasury
                ↓
     Emite RecoveryPurchased(user, token, amount, timestamp)
                ↓
     Backend verifica evento on-chain → restaura vida
```

**Precio anclado en USD:** $0.10 USD por vida.

| Token | Fórmula (6 decimales) | Ejemplo (COP/USD ≈ 3550) |
|-------|------------------------|---------------------------|
| USDC | `usdCents × 10_000` | 0.10 USDC |
| tCOPM | `usdCents × COP/USD × 10_000` | ~355 tCOPM |

La tasa **COP/USD se obtiene en vivo** desde [open.er-api.com](https://open.er-api.com) (cache 1h).
Si la API falla, usa `COP_PER_USD` en `.env` como respaldo.

Variables en `.env`:

```env
RECOVERY_PRICE_USD_CENTS=10      # 10 = $0.10
# COP_PER_USD=4000               # opcional, solo fallback
```

Después de cambios de tasa, sincroniza el contrato on-chain:

```bash
npm run contracts:sync:recovery-prices
```

**Owner del contrato:** puede cambiar precio por token, tokens permitidos y treasury.

---

## Prerequisites

1. Node.js 18+
2. CELO test tokens → [faucet.celo.org/celo-sepolia](https://faucet.celo.org/celo-sepolia)
3. `DEPLOYER_PRIVATE_KEY` in `.env` (never commit)

---

## 1. Install & compile

```bash
npm install
npm run contracts:compile
```

---

## 2. Configure `.env`

```env
DEPLOYER_PRIVATE_KEY=your_key_without_0x
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
NEXT_PUBLIC_CELO_NETWORK=sepolia

# Treasury (recibe los pagos)
RECOVERY_TREASURY_ADDRESS=0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4
NEXT_PUBLIC_RECOVERY_TREASURY=0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4

# tCOPM (deploy with npm run contracts:deploy:tcopm)
TCOPM_ADDRESS=
NEXT_PUBLIC_TCOPM_ADDRESS=

# USDC Celo Sepolia (official testnet)
USDC_ADDRESS=0x01C5C0122039549AD1493B8220cABEdD739BC44E
NEXT_PUBLIC_USDC_ADDRESS=0x01C5C0122039549AD1493B8220cABEdD739BC44E

# RecoveryPaymentContract (deploy step 4)
RECOVERY_CONTRACT_ADDRESS=
NEXT_PUBLIC_RECOVERY_CONTRACT_ADDRESS=

RECOVERY_DEMO_MODE=false
NEXT_PUBLIC_RECOVERY_DEMO_MODE=false

# Pricing: $0.10 USD per life; tCOPM uses live COP/USD (see contracts/README.md)
RECOVERY_PRICE_USD_CENTS=10
NEXT_PUBLIC_RECOVERY_PRICE_USD_CENTS=10
```

---

## 3. Deploy tCOPM (if not deployed)

```bash
npm run contracts:deploy:tcopm
```

Copy the address into `.env` as `TCOPM_ADDRESS` / `NEXT_PUBLIC_TCOPM_ADDRESS`.

Mint test tokens to your wallet:

```bash
npm run contracts:mint:tcopm
```

---

## 4. Deploy RecoveryPaymentContract

Requires `TCOPM_ADDRESS`, `USDC_ADDRESS`, and treasury in `.env`.

```bash
npm run contracts:deploy:recovery
```

Output:

```
✅ RecoveryPaymentContract deployed: 0x...
  Allowing tCOPM: 0x...
  Allowing USDC: 0x01C5...
```

Add to `.env`:

```env
RECOVERY_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RECOVERY_CONTRACT_ADDRESS=0x...
```

Metadata saved to `contracts/deployments/celo-sepolia-recovery-payment.json`.

---

## 5. Verify on CeloScan (Blockscout)

1. Open [celo-sepolia.blockscout.com](https://celo-sepolia.blockscout.com)
2. Paste the contract address
3. **Contract → Verify & Publish**
4. Compiler: `0.8.20`, optimizer 200 runs
5. Source: flatten or upload `RecoveryPaymentContract.sol` + OpenZeppelin imports

Or verify via Hardhat (if plugin configured):

```bash
npx hardhat verify --network celoSepolia <CONTRACT_ADDRESS> <TREASURY>
```

Constructor args:
- `_treasury`: treasury address (e.g. `0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4`)

Prices are set after deploy via `setRecoveryPriceForToken` (see deploy script).

---

## 6. Test payments (both tokens)

### tCOPM

1. Ensure wallet has enough tCOPM at the current live rate (run sync script) and CELO for gas
2. In CeloQuest: lose your life → Refill screen
3. Dropdown: **Pagar con tCOPM**
4. Select Rabby/MetaMask → Pay
5. Approve tCOPM (first time) → Confirm `purchaseRecovery`
6. Check Blockscout for `RecoveryPurchased` event

### USDC (Sepolia)

1. Get test USDC on Celo Sepolia (faucet / bridge)
2. Dropdown: **Pagar con USDC**
3. Same flow: approve → purchaseRecovery

### Verify backend

After tx confirms, CeloQuest calls `POST /api/challenge/refill` with `txHash`.  
Server reads `RecoveryPurchased` from `RecoveryPaymentContract` and restores 1 life.

---

## Owner admin functions

Only the deployer (owner) can call:

| Function | Purpose |
|----------|---------|
| `setRecoveryPriceForToken(address, uint256)` | Change price for one token (atomic units) |
| `setAllowedToken(address, bool)` | Add/remove accepted tokens |
| `setTreasury(address)` | Change treasury wallet |
| `withdrawToken(address, uint256)` | Recover tokens stuck in contract |

Example (Hardhat console):

```javascript
const c = await ethers.getContractAt("RecoveryPaymentContract", "<ADDRESS>");
await c.setRecoveryPriceForToken("<TCOPM>", 500000000n); // 500 tCOPM
await c.setRecoveryPriceForToken("<USDC>", 100000n);      // 0.10 USDC
await c.setAllowedToken("<NEW_TOKEN>", true);
```

Or sync from `.env`:

```bash
npm run contracts:sync:recovery-prices
```

---

## Mainnet migration (tCOPM → cCOPM)

1. Set `NEXT_PUBLIC_CELO_NETWORK=mainnet`
2. Deploy or configure real **cCOPM** address
3. Deploy new `RecoveryPaymentContract` on mainnet
4. Call `setAllowedToken(cCOPM, true)` and `setAllowedToken(USDC, true)`
5. Update `.env` with mainnet addresses

No frontend code changes required — token list comes from env + contract config.

---

## Events

```solidity
event RecoveryPurchased(
    address indexed user,
    address indexed token,
    uint256 amount,
    uint256 timestamp
);
```

Used by `src/lib/payments/recovery.ts` for server-side verification.

---

## File map

| Path | Description |
|------|-------------|
| `contracts/RecoveryPaymentContract.sol` | Payment contract |
| `contracts/TCOPM.sol` | Test token |
| `scripts/deploy-recovery-payment.js` | Deploy + allow tokens |
| `src/lib/contracts/recovery-payment-abi.ts` | Frontend/backend ABI |
| `src/lib/payments/recovery.ts` | On-chain verification |
| `src/lib/wallet.ts` | Approve + purchaseRecovery flow |
