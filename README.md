# CeloQuest

> Learn Web3. Explore Celo. Earn your place.

CeloQuest es una plataforma de onboarding gamificada para el ecosistema **Celo**, pensada para el **Celo Colombia Hackathon**. Convierte personas sin experiencia blockchain en usuarios activos diarios mediante retos estilo Duolingo: preguntas, XP, rachas, niveles, ranking semanal, logros NFT y recompensas on-chain en **tCOPM**.

## Características

- **Retos diarios**: 5 preguntas por día, **1 vida** (+ 1 recuperación pagada al día), máximo 10 XP diarios (+2 XP por respuesta correcta). Cada error muestra la respuesta correcta y una explicación educativa.
- **Progreso**: XP total, **3 niveles** (Explorador Web3 → Usuario Blockchain → Celo Explorer), racha diaria, dominio por categoría y página **Mi progreso**.
- **Logros y NFTs**: badges y **ERC-1155** reclamables (wallet, retos, rachas, nivel Celo Explorer) + NFTs automáticos para el top 3 semanal.
- **Identidad por wallet**: cuenta, progreso y ranking vinculados a una wallet conectada (MiniPay, MetaMask, Rabby). Un wallet = una cuenta.
- **Pagos on-chain**: recuperación de vida con **tCOPM** o **USDC** vía `RecoveryPaymentContract` (~$0.10 USD, tasa COP en vivo).
- **Recompensas semanales**: el campeón recibe **25,000 tCOPM** desde `CeloQuestRewards.sol` (pago verificado on-chain + historial en admin).
- **Panel admin**: estadísticas, transacciones, temporadas, forzar pago, envío de tokens y enlaces a CeloScan.
- **Onboarding**: slides educativos + video de creación de wallet.
- **Internacional**: español e inglés (contenido de preguntas, logros y UI).

## Smart contracts (Celo Sepolia)

| Contrato | Propósito |
| --- | --- |
| `TCOPM.sol` | Token ERC-20 de prueba (6 decimales) |
| `RecoveryPaymentContract.sol` | Pagos multi-token para recuperar vidas |
| `CeloQuestRewards.sol` | Premio semanal al ganador de la temporada |
| `CeloQuestAchievements.sol` | Logros **ERC-1155** (IDs 1–5 manual, 6–8 competitivos) |

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
- `ACHIEVEMENTS_CONTRACT_ADDRESS` — para mint de logros NFT
- `NEXT_PUBLIC_APP_URL` — URL pública de la app (metadata NFT; en local: `http://localhost:3000`)
- `DEPLOYER_PRIVATE_KEY` — solo servidor (admin / recompensas / mint); **nunca commitear**

### 2. Instalar y arrancar

```bash
npm install
npm run db:setup    # migraciones + seed (banco de preguntas ES/EN)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Para volver a cargar preguntas:

```bash
npm run db:seed:force
```

### 3. Contratos (testnet)

```bash
npm run contracts:compile
npm run contracts:deploy:tcopm
npm run contracts:deploy:recovery
npm run contracts:deploy:rewards
npm run contracts:deploy:achievements
npm run contracts:sync:recovery-prices
npm run nft:sync    # copia imágenes NFTS/ → public/ y genera metadata JSON
```

Tras desplegar en Vercel, actualiza la URI on-chain de los NFT:

```bash
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app npm run contracts:set:achievements-uri
```

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
    achievements/         # Reclamar NFTs de logros
    leaderboard/          # Ranking semanal y global
    medals/               # Medallas e historial competitivo
    admin/                # Panel administrador
    api/                  # REST (challenge, wallet, admin, …)
  lib/
    achievements/         # Catálogo i18n de logros
    nft/                  # Mint on-chain ERC-1155
    questions/            # Banco, niveles, selección adaptiva
    seasons/              # Etiquetas de temporada para logros
    seasons.ts            # Temporadas, archivo y nueva temporada
    rewards/              # Pago on-chain de recompensas
    payments/             # Verificación RecoveryPurchased
    tokens/               # tCOPM, USDC, pricing
contracts/
  *.sol                   # Contratos desplegados en Celo Sepolia
prisma/
  questions-bank.ts       # Banco de preguntas (ES/EN)
  seed.ts                 # Carga el banco a PostgreSQL
public/nft-assets/        # Metadata e imágenes NFT servidas por la app
NFTS/                     # Fuente de imágenes PNG (npm run nft:sync)
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
| Premio semanal | 25,000 tCOPM al #1 |
| Desempate en ranking | Menor tiempo acumulado |

Las preguntas del día se eligen de forma **adaptiva** según el nivel del usuario y evitan repeticiones recientes. La validación ocurre en el servidor (`correctIndex` no se envía al cliente).

## Banco de preguntas

Las preguntas viven en **`prisma/questions-bank.ts`** (6 categorías: blockchain, wallets, celo, minipay, stablecoins, security) y se cargan a PostgreSQL con `npm run db:seed`. Para ampliar el banco, edita `questions-bank.ts` y ejecuta `npm run db:seed:force`.

## Logros NFT

| Tipo | Ejemplos | Cómo se obtiene |
| --- | --- | --- |
| Manual (reclamar) | Primera wallet, primer reto, rachas 3/7, Celo Explorer | Botón en **Mis logros** |
| Badge (solo app) | Primer aprendizaje Celo, Usuario Blockchain | Automático al desbloquear |
| Competitivo (auto) | Campeón, subcampeón, tercer lugar | Al cerrar la temporada semanal |

Los logros competitivos muestran la **temporada y fechas** en las que se ganaron. Para que las imágenes se vean en la wallet, la metadata debe servirse desde una **URL pública** (ver `docs/VERCEL_DEPLOY.md`).

## Scripts útiles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build producción (+ migrate deploy) |
| `npm run db:setup` | Migraciones + seed |
| `npm run db:seed` / `db:seed:force` | Cargar / recargar preguntas |
| `npm run nft:sync` | Regenerar metadata NFT (usa `NEXT_PUBLIC_APP_URL`) |
| `npm run contracts:deploy:achievements` | Desplegar contrato ERC-1155 |
| `npm run contracts:set:achievements-uri` | Actualizar base URI on-chain de logros NFT |
| `npm run db:reset-today` | Reinicia el reto diario (solo dev local) |
| `npm run contracts:mint:tcopm:supply` | Mint tCOPM al admin |

## Despliegue

Despliegue recomendado en **Vercel** + **Supabase**. Guía completa: [`docs/VERCEL_DEPLOY.md`](docs/VERCEL_DEPLOY.md).

Resumen rápido:

1. Conectar repo en Vercel y copiar variables de `.env.example`
2. `DATABASE_URL` = pooler Supabase (6543) · `DIRECT_URL` = conexión directa (5432)
3. Tras el primer deploy: `npm run db:seed` contra la DB de producción
4. Configurar `NEXT_PUBLIC_APP_URL`, `npm run nft:sync` y `contracts:set:achievements-uri`

Healthcheck: `GET /api/health`

## Roadmap

- ~~Mint on-chain de NFTs para logros~~ (Sepolia)
- Autenticación SIWE (firma de wallet)
- Editor de preguntas en el panel admin
- Cierre automático de temporadas (cron)
- Celo Mainnet con cCOPM
