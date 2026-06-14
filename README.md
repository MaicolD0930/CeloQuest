# CeloQuest

> Learn Web3. Explore Celo. Earn your place.

CeloQuest es una plataforma de onboarding gamificada para el ecosistema **Celo**, pensada para el **Celo Colombia Hackathon**. Convierte personas sin experiencia blockchain en usuarios activos mediante retos diarios estilo Duolingo: preguntas, XP, rachas, niveles, ranking semanal y recompensas on-chain en **tCOPM**.

## Características

- **Retos diarios**: 5 preguntas por día, **1 vida** (+ 1 recuperación pagada al día), máximo 10 XP diarios (+2 XP por respuesta correcta). Cada error muestra la respuesta correcta y una explicación educativa.
- **Progreso**: XP total, niveles, racha diaria y ranking semanal por temporadas (lunes a domingo).
- **Identidad por wallet**: cuenta, progreso y ranking vinculados a una wallet conectada (MiniPay, MetaMask, Rabby). Un wallet = una cuenta.
- **Pagos on-chain**: recuperación de vida con **tCOPM** o **USDC** vía `RecoveryPaymentContract` (~$0.10 USD, tasa COP en vivo).
- **Recompensas semanales**: el campeón recibe **25,000 tCOPM** desde `CeloQuestRewards.sol` (pago verificado on-chain + historial en admin).
- **Panel admin**: estadísticas, transacciones, temporadas, forzar pago, envío de tokens y enlaces a CeloScan.
- **Onboarding**: slides educativos + video de creación de wallet.
- **Internacional**: español e inglés (contenido de preguntas y UI).

## Smart contracts (Celo Sepolia)

| Contrato | Propósito |
| --- | --- |
| `TCOPM.sol` | Token ERC-20 de prueba (6 decimales) |
| `RecoveryPaymentContract.sol` | Pagos multi-token para recuperar vidas |
| `CeloQuestRewards.sol` | Premio semanal al ganador de la temporada |

Ver despliegue y configuración en [`contracts/README.md`](contracts/README.md).

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
- `DEPLOYER_PRIVATE_KEY` — solo servidor (admin / recompensas); **nunca commitear**

### 2. Instalar y arrancar

```bash
npm install
npm run db:setup    # migraciones + seed (33 preguntas ES/EN)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Para volver a cargar preguntas:

```bash
npm run db:seed:force
```

### 3. Contratos (opcional, testnet)

```bash
npm run contracts:compile
npm run contracts:deploy:tcopm
npm run contracts:deploy:recovery
npm run contracts:deploy:rewards
npm run contracts:sync:recovery-prices
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
    leaderboard/          # Ranking semanal y global
    medals/               # Logros e historial
    admin/                # Panel administrador
    api/                  # REST (challenge, wallet, admin, …)
  lib/
    seasons.ts            # Temporadas, archivo y nueva temporada
    rewards/              # Pago on-chain de recompensas
    payments/             # Verificación RecoveryPurchased
    tokens/               # tCOPM, USDC, pricing
contracts/
  *.sol                   # Contratos desplegados en Celo Sepolia
prisma/
  seed.ts                 # Banco de 33 preguntas (ES/EN)
```

## Reglas del juego

| Regla | Valor |
| --- | --- |
| Preguntas por día | 5 |
| Vidas por día | 1 (+ 1 refill pagado máx.) |
| XP por respuesta correcta | +2 |
| XP máximo diario | 10 |
| Premio semanal | 25,000 tCOPM al #1 |
| Desempate en ranking | Menor tiempo acumulado |

Las preguntas del día se eligen de forma determinística por usuario y fecha. La validación ocurre en el servidor (`correctIndex` no se envía al cliente).

## Banco de preguntas

Las preguntas viven en **`prisma/seed.ts`** (33 ítems, 5 categorías: blockchain, wallets, celo, minipay, stablecoins) y se cargan a PostgreSQL con el seed. Para ampliar el banco, edita `seed.ts` y ejecuta `npm run db:seed:force`.

## Scripts útiles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build producción (+ migrate deploy) |
| `npm run db:reset-today` | Reinicia el reto diario (dev) |
| `npm run contracts:mint:tcopm:supply` | Mint tCOPM al admin |

## Roadmap

- Mint on-chain de NFTs para logros
- Autenticación SIWE (firma de wallet)
- Editor de preguntas en el panel admin
- Cierre automático de temporadas (cron)
- Celo Mainnet con cCOPM
