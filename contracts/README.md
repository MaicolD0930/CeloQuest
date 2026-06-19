# CeloQuest Smart Contracts

Contratos desplegados en **Celo Mainnet** para recuperación de vidas y premios semanales.

| Contrato | Propósito |
|----------|-----------|
| `RecoveryPaymentContract.sol` | Precios on-chain y respaldo para pagos multi-token |
| `CeloQuestRewards.sol` | Premio semanal al campeón en USDC |

---

## Direcciones (Celo Mainnet)

| Recurso | Dirección | Rol |
|---------|-----------|-----|
| **RecoveryPaymentContract** | `0x3e67516C6809162124411f5e88D16EE75e738983` | Precios on-chain; respaldo |
| **CeloQuestRewards** | `0xA975A17D5f6D3a081Ad617b437867eF0CfD27F95` | Premio semanal USDC |
| **Treasury** | `0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4` | Recibe pagos de recuperación; owner/admin |
| **USDC** (oficial Celo) | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` | Pago de vida + fondeo de premios |
| **cCOP / COPm** (Mento) | `0x8A567e2aE79CA692Bd748aB832081C45de4041eA` | Pago de vida en COP |

Metadata en `contracts/deployments/celo-mainnet-recovery-payment.json` y `celo-mainnet-rewards.json`.

---

## Flujo de recuperación de vida (producción)

```
Usuario elige USDC o cCOP
        ↓
MiniPay / MetaMask / Rabby
        ↓
Transferencia ERC-20 directa → Treasury
        ↓
Backend verifica el recibo on-chain (transfer al treasury)
        ↓
Se restaura 1 vida en el reto del día
```

En la app actual, el pago habitual es **transferencia directa al treasury** (`src/lib/wallet.ts`). El contrato `RecoveryPaymentContract` queda desplegado con precios sincronizados como referencia on-chain.

### Precios

| Token | Monto | Variable `.env` |
|-------|-------|------------------|
| USDC | **0.01 USDC** | `RECOVERY_PRICE_USD_CENTS=1` |
| cCOP | **10 cCOP** fijos | `RECOVERY_CCOPM_FIXED=10` |

Sincronizar precios on-chain en el contrato:

```bash
npm run contracts:sync:recovery-prices
```

---

## CeloQuestRewards (premio semanal)

| Función | Quién la llama | Propósito |
|---------|----------------|-----------|
| `finalizeSeasonReward` | Owner o automator | Pago programado (Vercel Cron → `/api/cron/seasons`) |
| `finalizeSeasonRewardForced` | Solo owner | Override manual desde el panel admin |
| `deposit` | Owner | Fondear el contrato con USDC |
| `setAutomator` | Owner | Actualizar wallet del backend/cron |

- **UI:** muestra **3 USDC** al campeón.
- **On-chain:** `REWARD_AMOUNT = 50_000` → **0.05 USDC** (6 decimales).

El contrato debe estar **fondeado con USDC** antes de cada temporada.

### Evento

```solidity
event SeasonRewardPaid(
    bytes32 indexed seasonId,
    address indexed winner,
    uint256 amount,
    uint256 timestamp,
    bool forced
);
```

---

## RecoveryPaymentContract (referencia)

El contrato expone `purchaseRecovery(token)` y emite `RecoveryPurchased`. En producción la app verifica principalmente **transferencias al treasury**; el contrato mantiene precios y tokens permitidos para administración.

### Funciones owner

| Función | Propósito |
|---------|---------|
| `setRecoveryPriceForToken(address, uint256)` | Cambiar precio por token (unidades atómicas) |
| `setAllowedToken(address, bool)` | Añadir/quitar tokens aceptados |
| `setTreasury(address)` | Cambiar wallet treasury |
| `withdrawToken(address, uint256)` | Recuperar tokens atascados en el contrato |

```bash
npm run contracts:sync:recovery-prices
```

---

## Deploy

### Requisitos

1. Node.js 18+
2. CELO en la wallet deployer (gas mainnet)
3. `DEPLOYER_PRIVATE_KEY` en `.env` (nunca commitear)

### Compilar

```bash
npm install
npm run contracts:compile
```

### Variables `.env` (mainnet)

```env
NEXT_PUBLIC_CELO_NETWORK=mainnet
CELO_NETWORK=mainnet
CELO_RPC_URL=https://forno.celo.org

DEPLOYER_PRIVATE_KEY=...

RECOVERY_TREASURY_ADDRESS=0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4
NEXT_PUBLIC_RECOVERY_TREASURY=0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4

USDC_ADDRESS=0xcebA9300f2b948710d2653dD7B07f33A8B32118C
NEXT_PUBLIC_USDC_ADDRESS=0xcebA9300f2b948710d2653dD7B07f33A8B32118C

CCOPM_ADDRESS=0x8A567e2aE79CA692Bd748aB832081C45de4041eA
NEXT_PUBLIC_CCOPM_ADDRESS=0x8A567e2aE79CA692Bd748aB832081C45de4041eA

RECOVERY_PRICE_USD_CENTS=1
RECOVERY_CCOPM_FIXED=10

RECOVERY_CONTRACT_ADDRESS=0x3e67516C6809162124411f5e88D16EE75e738983
NEXT_PUBLIC_RECOVERY_CONTRACT_ADDRESS=0x3e67516C6809162124411f5e88D16EE75e738983

REWARDS_CONTRACT_ADDRESS=0xA975A17D5f6D3a081Ad617b437867eF0CfD27F95
NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS=0xA975A17D5f6D3a081Ad617b437867eF0CfD27F95
REWARDS_AUTOMATOR_ADDRESS=0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4
```

### Desplegar (si redeploy)

```bash
npm run contracts:deploy:recovery:mainnet
npm run contracts:deploy:rewards:mainnet
npm run contracts:sync:recovery-prices
```

### Verificar en CeloScan

[Celoscan](https://celoscan.io) → Contract → Verify & Publish  
Compiler: `0.8.20`, optimizer 200 runs.

---

## Mapa de archivos

| Ruta | Descripción |
|------|-------------|
| `contracts/RecoveryPaymentContract.sol` | Contrato de pagos de recuperación |
| `contracts/CeloQuestRewards.sol` | Contrato de premios semanales |
| `contracts/deployments/celo-mainnet-*.json` | Direcciones y parámetros de deploy |
| `scripts/deploy-recovery-payment.js` | Deploy recovery + allow tokens |
| `scripts/deploy-rewards.js` | Deploy premios USDC |
| `src/lib/contracts/recovery-payment-abi.ts` | ABI recovery |
| `src/lib/contracts/rewards-abi.ts` | ABI rewards |
| `src/lib/payments/recovery.ts` | Verificación on-chain post-pago |
| `src/lib/wallet.ts` | Envío de transferencia al treasury |
