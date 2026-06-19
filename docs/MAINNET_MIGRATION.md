# Celo Mainnet — estado actual

> **Migración completada.** CeloQuest opera en **Celo Mainnet** con USDC y cCOP.  
> Documentación vigente:
> - [`README.md`](../README.md)
> - [`contracts/README.md`](../contracts/README.md)
> - [`docs/VERCEL_DEPLOY.md`](VERCEL_DEPLOY.md)

---

# Migración a Celo Mainnet (referencia histórica)

> El contenido siguiente describe el plan original de migración. Ya aplicado en producción.

## Objetivo

Mostrar un **flujo real en mainnet** ante jurados o usuarios piloto:

- Reto diario (app + DB, como hoy)
- **Revivir vida** con transacción on-chain (cCOPM o USDC)
- **Premio semanal** pagado on-chain al ganador

Montos **bajos a propósito** para poder hacer muchas pruebas sin gastar mucho.

---

## Configuración recomendada para demo

| Concepto | Valor demo | Notas |
|----------|------------|-------|
| Revive (USDC) | **$0.05** o **$0.10** | vía `RECOVERY_PRICE_USD_CENTS=5` o `10` |
| Revive (cCOPM) | **100 COP fijos** | Precio fijo on-chain, no atado a TRM |
| Premio semanal | **1.000 cCOPM** | Simbólico; explicar a jurados que en producción sube |
| Token de premio/pagos COP | **cCOPM / COPm (Mento)** | No desplegar token propio |

### Direcciones mainnet (referencia)

| Token | Dirección | Uso |
|-------|-----------|-----|
| cCOPM (COPm) | `0x8a567e2ae79ca692bd748ab832081c45de4041ea` | Recuperación + premios |
| USDC (native Celo) | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` | Recuperación alternativa |

Verificar direcciones en [Celo Docs — Local Stablecoins](https://docs.celo.org/build-on-celo/build-with-local-stablecoin) antes del deploy.

---

## Presupuesto estimado (bootstrap demo)

Partida de referencia: **~1 CELO + ~$5 USD** (p. ej. recarga Binance → retiro a red Celo).

| Uso | Monto aprox. | Quién paga |
|-----|--------------|------------|
| Deploy contratos + gas admin | 0.05–0.2 CELO | Operador |
| Fondo premios (3 semanas × 1.000 COP) | ~3.000 cCOPM (~$0.75) | Operador |
| Tokens para wallets de jurados | ~500 cCOPM + algo de USDC c/u | Operador (airdrop previo) |
| Cada revive en demo | 100 cCOPM o $0.05 USDC | **El jurado/usuario** → va al treasury |

**Importante:** los pagos de recuperación **no salen del bolsillo del operador**; los usuarios pagan y el treasury recibe. El operador solo necesita CELO para gas y un fondo pequeño de cCOPM para premios + airdrops de prueba.

Con revive a **$0.05**, **$1 USDC ≈ 20 pruebas** por persona.

---

## Estructura de wallets

| Wallet | Rol | Qué guardar |
|--------|-----|-------------|
| **Principal (deployer)** | `DEPLOYER_PRIVATE_KEY` en `.env` | CELO para gas; owner de contratos; firma premios |
| **Treasury (secundaria)** | `RECOVERY_TREASURY_ADDRESS` | Recibe pagos de recuperación; ideal **distinta** al deployer |
| **Contrato CeloQuestRewards** | On-chain | Depósito de cCOPM para premios semanales |

**Seguridad:** nunca commitear `.env`. En producción, implementar SIWE real (no solo cookie de wallet).

---

## Qué cambia respecto a testnet

### Lo que NO hay que hacer

- **No desplegar `TCOPM.sol`** en mainnet — usar cCOPM oficial de Mento.
- No hace falta mintear token propio.

### Contratos a desplegar en mainnet

1. **`RecoveryPaymentContract`** — pagos por revivir
2. **`CeloQuestRewards`** — premio semanal al campeón

### Cambios de código necesarios (pendientes al migrar)

| Área | Estado actual (testnet) | Cambio para demo mainnet |
|------|-------------------------|---------------------------|
| `NEXT_PUBLIC_CELO_NETWORK` | `sepolia` | `mainnet` |
| Token COP | `TCOPM_ADDRESS` | `CCOPM_ADDRESS` |
| USDC | Sepolia testnet | USDC mainnet |
| `CeloQuestRewards.sol` | `REWARD_AMOUNT = 25_000` fijo | Cambiar a **1.000** (o hacer configurable por env y redeploy) |
| `rewards-abi.ts` | `WEEKLY_REWARD_USDC = "3"` | debe coincidir con contrato |
| `dictionaries.ts` landing | `"25k tCOPM / semana"` | `"1.000 COPM / semana"` |
| `hardhat.config.ts` | Solo `celoSepolia` | Añadir red `celo` mainnet |
| Scripts deploy | `network: celoSepolia` | Variante mainnet + `CCOPM_ADDRESS` |

---

## Variables `.env` (mainnet — borrador)

```env
# Red
NEXT_PUBLIC_CELO_NETWORK=mainnet
CELO_NETWORK=mainnet
CELO_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org

# Tokens
CCOPM_ADDRESS=0x8a567e2ae79ca692bd748ab832081c45de4041ea
NEXT_PUBLIC_CCOPM_ADDRESS=0x8a567e2ae79ca692bd748ab832081c45de4041ea
USDC_ADDRESS=0xcebA9300f2b948710d2653dD7B07f33A8B32118C
NEXT_PUBLIC_USDC_ADDRESS=0xcebA9300f2b948710d2653dD7B07f33A8B32118C

# Precio revive USD ($0.05 demo)
RECOVERY_PRICE_USD_CENTS=5
NEXT_PUBLIC_RECOVERY_PRICE_USD_CENTS=5

# Wallets
DEPLOYER_PRIVATE_KEY=...
RECOVERY_TREASURY_ADDRESS=0x...
NEXT_PUBLIC_RECOVERY_TREASURY=0x...

# Tras deploy
RECOVERY_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RECOVERY_CONTRACT_ADDRESS=0x...
REWARDS_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS=0x...

RECOVERY_DEMO_MODE=false
NEXT_PUBLIC_RECOVERY_DEMO_MODE=false
```

---

## Pasos de migración (checklist)

### 1. Fondos

- [ ] Retirar desde Binance (u otro CEX) a **red Celo** — CELO + USDC (no BSC/Ethereum)
- [ ] Reservar ~1 CELO en deployer (gas)
- [ ] Swapear parte de USDC → cCOPM si hace falta (Mento / Uniswap V3 en Celo)

### 2. Hardhat y contratos

- [ ] Añadir red `celo` en `hardhat.config.ts`
- [ ] Modificar `CeloQuestRewards.sol`: premio demo **1.000 cCOPM** (`1_000 * 10**6`)
- [ ] Compilar: `npm run contracts:compile`
- [ ] Desplegar recovery: `npm run contracts:deploy:recovery` (adaptar script a mainnet)
- [ ] Fijar precio cCOPM a **100 COP** on-chain:
  ```javascript
  // 100 cCOPM con 6 decimales
  await contract.setRecoveryPriceForToken(CCOPM, 100_000_000n);
  ```
- [ ] Sync precio USDC desde env: `npm run contracts:sync:recovery-prices`
- [ ] Desplegar rewards apuntando a `CCOPM_ADDRESS`
- [ ] Depositar cCOPM en `CeloQuestRewards` (approve + `deposit()`)

### 3. App

- [ ] Actualizar `.env` con direcciones mainnet
- [ ] Actualizar textos UI (premio 1.000, no 25k)
- [ ] Verificar en CeloScan: eventos `RecoveryPurchased` y `SeasonRewardPaid`
- [ ] Probar flujo completo: perder vida → pagar → revivir → completar semana → admin paga premio

### 4. Demo con jurados

- [ ] Crear wallets (MiniPay / MetaMask / Rabby) en Celo Mainnet
- [ ] Airdrop: CELO (gas) + ~500 cCOPM + ~$0.50 USDC por jurado
- [ ] Guión verbal: “mainnet real, montos de demo, flujo verificable en explorer”

---

## Guión para presentar a jurados

1. **Red real:** transacciones en Celo Mainnet, visibles en CeloScan.
2. **Juego:** reto diario, XP, ranking (como la app actual).
3. **Economía on-chain — revive:** pierden vida → pagan 100 cCOPM o $0.05 USDC → tx real → vida restaurada.
4. **Economía on-chain — premio:** ganador semanal recibe 1.000 cCOPM vía contrato `CeloQuestRewards`.
5. **Transparencia:** eventos `RecoveryPurchased` y `SeasonRewardPaid` en el explorer.

---

## Binance → Celo (notas)

- Elegir red de retiro: **Celo** (también llamada CELO en algunos exchanges).
- Comisiones y mínimos de retiro reducen el presupuesto útil (~$4–4.50 netos desde $5).
- cCOPM puede no estar disponible directo en Binance; más simple: **USDC en Celo** y swap interno a cCOPM.
- cCOPM puede usarse como gas en Celo (Mento); igual conviene algo de CELO en cada wallet.

---

## Producción post-demo (cuando escale)

| Demo | Producción (referencia actual del producto) |
|------|---------------------------------------------|
| 1.000 cCOPM / semana | 25.000 cCOPM / semana (requiere más fondo en contrato) |
| $0.05–0.10 / revive | $0.10 USD anclado (configurable) |
| Premio fijo en contrato | Valorar hacer `REWARD_AMOUNT` configurable o redeploy por temporada |

Mantener fondo de premios de al menos **2–3 semanas** en el contrato de rewards antes de abrir a usuarios reales.

---

## Referencias en el repo

| Archivo | Descripción |
|---------|-------------|
| `contracts/README.md` | Arquitectura de contratos y testnet |
| `contracts/CeloQuestRewards.sol` | Premio semanal (amount fijo hoy) |
| `contracts/RecoveryPaymentContract.sol` | Pagos por token |
| `src/lib/chain/config.ts` | Switch sepolia / mainnet |
| `src/lib/tokens/recovery.ts` | tCOPM vs cCOPM por red |
| `src/lib/pricing/recovery-price.ts` | Precio USD + conversión COP |
| `scripts/deploy-recovery-payment.js` | Deploy recovery |
| `scripts/deploy-rewards.js` | Deploy rewards |
| `scripts/sync-recovery-prices.js` | Sync precios on-chain |

---

*Documento creado para planificación. CeloQuest continúa en testnet hasta que se decida ejecutar esta migración.*
