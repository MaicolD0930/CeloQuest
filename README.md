# CeloQuest

> Learn Web3. Explore Celo. Earn your place.

CeloQuest es una plataforma de onboarding gamificada para el ecosistema **Celo**, pensada para el **Celo Colombia Hackathon**. Convierte personas sin experiencia blockchain en usuarios activos diarios mediante retos estilo Duolingo: preguntas, XP, rachas, niveles, ranking semanal, logros personales y recompensas on-chain en **USDC**.

## Características

- **Retos diarios**: 5 preguntas por día, **1 vida** (+ 1 recuperación pagada al día), máximo 10 XP diarios (+2 XP por respuesta correcta). Cada error muestra la respuesta correcta y una explicación educativa.
- **Progreso**: XP total, **3 niveles** (Explorador Web3 → Usuario Blockchain → Celo Explorer), racha diaria, dominio por categoría y página **Mi progreso**.
- **Logros personales**: medallas con imagen dentro de la app (sin mint blockchain). Se desbloquean al completar retos, rachas, niveles o quedar top 3 semanal.
- **Identidad por wallet**: cuenta, progreso y ranking vinculados a una wallet conectada (MiniPay, MetaMask, Rabby). Un wallet = una cuenta.
- **Pagos on-chain**: recuperación de vida con **tCOPM** o **USDC** vía `RecoveryPaymentContract` (~$0.10 USD, tasa COP en vivo).
- **Recompensas semanales**: el campeón recibe **3 USDC** desde `CeloQuestRewards.sol` (pago automático vía cron + forzado manual en admin).
- **Panel admin**: estadísticas, transacciones, temporadas, forzar pago, envío de tokens y enlaces a CeloScan.
- **Onboarding**: slides educativos + video de creación de wallet.
- **FAQ**: `/help` con preguntas frecuentes.
- **Internacional**: español e inglés (contenido de preguntas, logros y UI).

## Smart contracts (Celo Sepolia)

| Contrato | Propósito |
| --- | --- |
| `TCOPM.sol` | Token ERC-20 de prueba (6 decimales) — recuperación de vidas |
| `RecoveryPaymentContract.sol` | Pagos multi-token para recuperar vidas |
| `CeloQuestRewards.sol` | Premio semanal **3 USDC** al ganador (automático + forzado) |

Ver despliegue y configuración en [`contracts/README.md`](contracts/README.md).  
**Producción (Vercel):** [`docs/VERCEL_DEPLOY.md`](docs/VERCEL_DEPLOY.md).  
**Mainnet (futuro):** [`docs/MAINNET_MIGRATION.md`](docs/MAINNET_MIGRATION.md).

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript + Tailwind CSS v4
- [Prisma](https://www.prisma.io) + **PostgreSQL** (Supabase en producción)
- [viem](https://viem.sh) + wallets EIP-1193 / EIP-6963
- [Hardhat](https://hardhat.org) para contratos Solidity (OpenZeppelin)

## Empezar

### 1. Variables de entorno

Copia `.env.example` a `.env` y completa al menos:

- `DATABASE_URL` / `DIRECT_URL` — PostgreSQL
- `NEXT_PUBLIC_CELO_NETWORK=sepolia`
- `TCOPM_ADDRESS`, `USDC_ADDRESS`, `RECOVERY_CONTRACT_ADDRESS`, `REWARDS_CONTRACT_ADDRESS`
- `REWARDS_AUTOMATOR_ADDRESS` — wallet del cron/backend (puede ser la del deployer)
- `CRON_SECRET` — protege `/api/cron/seasons` en Vercel
- `NEXT_PUBLIC_APP_URL` — URL pública de la app (en local: `http://localhost:3000`)
- `DEPLOYER_PRIVATE_KEY` — solo servidor (admin / recompensas); **nunca commitear**

### 2. Instalar y arrancar

```bash
npm install
npm run db:setup    # migraciones + seed (banco de preguntas ES/EN)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 3. Contratos (testnet)

```bash
npm run contracts:compile
npm run contracts:deploy:tcopm
npm run contracts:deploy:recovery
npm run contracts:deploy:rewards    # USDC, 3 USDC/semana, automator
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
  lib/
    achievements/         # Catálogo i18n de logros (imágenes in-app)
    questions/            # Banco, niveles, selección adaptiva
    seasons/              # Temporadas, archivo y nueva temporada
    rewards/              # Pago on-chain de recompensas USDC
contracts/
  *.sol                   # Contratos desplegados en Celo Sepolia
public/nft-assets/images/ # Imágenes de logros (servidas estáticamente)
```

## Reglas del juego

| Regla | Valor |
| --- | --- |
| Preguntas por día | 5 |
| Vidas por día | 1 (+ 1 refill pagado máx.) |
| XP por respuesta correcta | +2 |
| XP máximo diario | 10 |
| Nivel 2 (Usuario Blockchain) | 150 XP total |
| Nivel 3 (Celo Explorer) | 500 XP total |
| Premio semanal | **3 USDC** al #1 |
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
| `npm run contracts:deploy:rewards` | Desplegar contrato de premios USDC |
| `npm run db:reset-today` | Reinicia el reto diario (solo dev local) |

## Despliegue

Despliegue recomendado en **Vercel** + **Supabase**. Guía completa: [`docs/VERCEL_DEPLOY.md`](docs/VERCEL_DEPLOY.md).

1. Conectar repo en Vercel y copiar variables de `.env.example`
2. Configurar `CRON_SECRET` y cron en `vercel.json` (lunes 08:00 UTC)
3. `DATABASE_URL` = pooler Supabase (6543) · `DIRECT_URL` = conexión directa (5432)
4. Tras el primer deploy: `npm run db:seed` contra la DB de producción
5. Fondear `CeloQuestRewards` con USDC

Healthcheck: `GET /api/health`

## Roadmap

- Autenticación SIWE (firma de wallet)
- Editor de preguntas en el panel admin
- Celo Mainnet con cCOPM
