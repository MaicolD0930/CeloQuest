# CeloQuest

> Learn Web3. Explore Celo. Earn your place.

CeloQuest es una plataforma de onboarding gamificada para el ecosistema **Celo**, pensada para el **Celo Colombia Hackathon**. Convierte personas sin experiencia blockchain en usuarios activos diarios mediante retos mediante: preguntas, XP, rachas, niveles, ranking semanal, logros personales y recompensas on-chain en **USDC**.

Desplegada en **Celo Mainnet** con pagos en **USDC** y **cCOP** (MiniPay, MetaMask, Rabby).

## Características

- **Retos diarios**: 5 preguntas por día, **1 vida** (+ 1 recuperación pagada por intento), máximo 10 XP diarios (+2 XP por respuesta correcta). Cada error muestra la respuesta correcta y una explicación educativa.
- **Progreso**: XP total, **3 niveles** (Explorador Web3 → Usuario Blockchain → Celo Explorer), racha diaria, dominio por categoría y página **Mi progreso**.
- **Logros personales**: medallas con imagen dentro de la app (sin mint blockchain). Se desbloquean al completar retos, rachas, niveles o quedar top 3 semanal.
- **Identidad por wallet**: cuenta, progreso y ranking vinculados a una wallet conectada (MiniPay, MetaMask, Rabby). Un wallet = una cuenta.
- **Pagos on-chain**: recuperación de vida con **USDC** (0.01 USDC) o **cCOP** (10 cCOP fijos).
- **Recompensas semanales**: el campeón recibe USDC desde `CeloQuestRewards.sol` (pago automático vía cron + forzado manual en admin). La UI muestra **3 USDC**; el monto on-chain actual es **0.05 USDC**.
- **Panel admin**: estadísticas, transacciones, temporadas, forzar pago, envío de tokens y enlaces a CeloScan.
- **Onboarding**: slides educativos + video de creación de wallet.
- **FAQ**: `/help` con preguntas frecuentes.
- **Internacional**: español e inglés (contenido de preguntas, logros y UI).

## Flujo on-chain

### Recuperación de vida

```
Usuario elige USDC o cCOP
        ↓
MiniPay / MetaMask / Rabby
        ↓
Transferencia ERC-20 directa → Treasury (wallet del proyecto)
        ↓
Backend verifica el recibo on-chain (transfer al treasury)
        ↓
Se restaura 1 vida en el reto del día
```

El pago es una **transferencia directa de token al treasury**. No requiere `approve` ni interacción con el contrato de recovery en el flujo habitual.

### Premio semanal

```
Cron Vercel (lunes) o admin manual
        ↓
CeloQuestRewards.finalizeSeasonReward(seasonId, winner)
        ↓
USDC del contrato → wallet del campeón (#1 del ranking semanal)
```

El contrato debe estar **fondeado con USDC** antes de cada temporada.

## Contratos y tokens (Celo Mainnet)

| Recurso | Dirección | Rol |
| --- | --- | --- |
| **RecoveryPaymentContract** | `0x3e67516C6809162124411f5e88D16EE75e738983` | Contrato desplegado (precios on-chain; pagos habituales van al treasury) |
| **CeloQuestRewards** | `0xA975A17D5f6D3a081Ad617b437867eF0CfD27F95` | Premio semanal al campeón en USDC |
| **Treasury** | `0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4` | Recibe pagos de recuperación; owner/admin |
| **USDC** (oficial Celo) | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` | Pago de vida + fondeo de premios |
| **cCOP / COPm** (Mento) | `0x8A567e2aE79CA692Bd748aB832081C45de4041eA` | Pago de vida en pesos colombianos |

Despliegues en `contracts/deployments/celo-mainnet-*.json`. Detalle técnico en [`contracts/README.md`](contracts/README.md).

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript + Tailwind CSS v4
- [Prisma](https://www.prisma.io) + **PostgreSQL** (Supabase en producción)
- [viem](https://viem.sh) + wallets EIP-1193 / EIP-6963 (MiniPay, MetaMask, Rabby)
- [Hardhat](https://hardhat.org) para contratos Solidity (OpenZeppelin)

## Empezar

### 1. Variables de entorno

Copia `.env.example` a `.env` y completa:

```env
NEXT_PUBLIC_CELO_NETWORK=mainnet
CELO_NETWORK=mainnet
CELO_RPC_URL=https://forno.celo.org

RECOVERY_TREASURY_ADDRESS=0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4
RECOVERY_CONTRACT_ADDRESS=0x3e67516C6809162124411f5e88D16EE75e738983
REWARDS_CONTRACT_ADDRESS=0xA975A17D5f6D3a081Ad617b437867eF0CfD27F95

USDC_ADDRESS=0xcebA9300f2b948710d2653dD7B07f33A8B32118C
CCOPM_ADDRESS=0x8A567e2aE79CA692Bd748aB832081C45de4041eA

RECOVERY_PRICE_USD_CENTS=1          # 0.01 USDC por vida
RECOVERY_CCOPM_FIXED=10             # 10 cCOP por vida
```

También necesitas:

- `DATABASE_URL` / `DIRECT_URL` — PostgreSQL (pooler 6543 + directo 5432 en Vercel)
- `REWARDS_AUTOMATOR_ADDRESS` — wallet del cron/backend
- `CRON_SECRET` — protege `/api/cron/seasons` en Vercel
- `NEXT_PUBLIC_APP_URL` — URL pública de la app
- `DEPLOYER_PRIVATE_KEY` — solo servidor (admin / recompensas); **nunca commitear**

### 2. Instalar y arrancar

```bash
npm install
npm run db:setup    # migraciones + seed (banco de preguntas ES/EN)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 3. Contratos

```bash
npm run contracts:compile
npm run contracts:deploy:recovery:mainnet
npm run contracts:deploy:rewards:mainnet
npm run contracts:sync:recovery-prices
```

Fondea `CeloQuestRewards` con USDC antes de pagar temporadas.

## Estructura

```
src/
  app/
    page.tsx              # Landing
    onboarding/           # Slides + video wallet
    connect/              # Wallet + perfil
    home/                 # Perfil y reto diario
    challenge/            # Quiz diario
    progress/             # Mi progreso (niveles, categorías, logros)
    achievements/         # Logros personales + historial
    help/                 # FAQ
    leaderboard/          # Ranking semanal y global
    admin/                # Panel administrador
    api/cron/seasons/     # Cierre automático semanal (Vercel Cron)
    api/health/           # Healthcheck (red, DB, versión)
  lib/
    wallet.ts             # Pagos de recuperación (transferencia al treasury)
    payments/             # Preparación y verificación de pagos
    achievements/         # Catálogo i18n de logros (imágenes in-app)
    questions/            # Banco, niveles, selección adaptiva
    seasons/              # Temporadas, archivo y nueva temporada
    rewards/              # Pago on-chain de recompensas USDC
contracts/
  *.sol                   # Contratos Solidity
  deployments/            # Direcciones mainnet
public/nft-assets/images/ # Imágenes de logros (servidas estáticamente)
```

## Reglas del juego

| Regla | Valor |
| --- | --- |
| Preguntas por día | 5 |
| Vidas por día | 1 (+ 1 refill pagado máx. por intento) |
| XP por respuesta correcta | +2 |
| XP máximo diario | 10 |
| Nivel 2 (Usuario Blockchain) | 150 XP total |
| Nivel 3 (Celo Explorer) | 500 XP total |
| Recuperación de vida | **0.01 USDC** o **10 cCOP** |
| Premio semanal (UI) | **3 USDC** al #1 |
| Premio semanal (on-chain) | **0.05 USDC** (`REWARD_AMOUNT` en contrato) |
| Desempate en ranking | Menor tiempo acumulado |

## Logros personales

| Tipo | Ejemplos | Cómo se obtiene |
| --- | --- | --- |
| Aprendizaje | Primera wallet, primer reto, rachas 3/7, Celo Explorer | Automático al desbloquear |
| Competitivo | Campeón, subcampeón, tercer lugar | Al cerrar la temporada semanal |

Las imágenes viven en `public/nft-assets/images/` y se muestran en **Mis logros** — no hay mint on-chain.

## Scripts útiles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build producción (+ migrate deploy) |
| `npm run db:setup` | Migraciones + seed |
| `npm run contracts:deploy:recovery:mainnet` | Desplegar recovery en mainnet |
| `npm run contracts:deploy:rewards:mainnet` | Desplegar premios USDC en mainnet |

## Despliegue

Despliegue en **Vercel** + **Supabase**. Guía: [`docs/VERCEL_DEPLOY.md`](docs/VERCEL_DEPLOY.md).

1. Conectar repo en Vercel y copiar variables de `.env.example`
2. Configurar `CRON_SECRET` y cron en `vercel.json` (lunes 08:00 UTC)
3. `DATABASE_URL` = pooler Supabase (6543) · `DIRECT_URL` = conexión directa (5432)
4. Tras el primer deploy: `npm run db:seed` contra la DB de producción
5. Fondear `CeloQuestRewards` con USDC
6. Verificar: `GET /api/health` → `network: "mainnet"`, `dbOk: true`

## Roadmap

- Autenticación SIWE (firma de wallet)
- Editor de preguntas en el panel admin
- Alinear monto on-chain del premio semanal con el valor mostrado en UI (3 USDC)
