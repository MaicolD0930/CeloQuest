# Despliegue en Vercel (CeloQuest)

Guía para dejar la app al **~90% lista** en producción (testnet Sepolia). Tras el primer deploy solo quedan pasos cortos: URL pública, seed, NFT metadata y `setBaseURI`.

## Requisitos previos

- Repo en GitHub: `MaicolD0930/CeloQuest` (raíz = carpeta `celoquest`)
- Proyecto Supabase con PostgreSQL
- Contratos ya desplegados en Celo Sepolia (tCOPM, recovery, rewards, achievements)
- Cuenta en [Vercel](https://vercel.com)

---

## 1. Conectar Vercel al repo

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository → `CeloQuest`
2. **Root Directory:** `.` (por defecto; no uses la carpeta padre `Celo`)
3. **Framework:** Next.js (auto)
4. **Build Command:** ya definido en `vercel.json`  
   `prisma generate && prisma migrate deploy && next build`
5. No despliegues aún — configura variables primero (paso 2)

---

## 2. Variables de entorno en Vercel

En **Project → Settings → Environment Variables**, añade todo lo de `.env.example` con valores reales.

### Base de datos (crítico para serverless)

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | **Pooler** Supabase (puerto **6543**, modo Transaction) |
| `DIRECT_URL` | Conexión **directa** (puerto **5432**) |

En Supabase: **Project Settings → Database → Connection string**

- **DATABASE_URL** → *Transaction pooler* + `?pgbouncer=true` (y suele añadirse `connection_limit=1` en Vercel)
- **DIRECT_URL** → *Session pooler* puerto **5432** en el mismo host `pooler.supabase.com` (Vercel no alcanza bien `db.xxx.supabase.co` por IPv6). Solo usa `db.xxx.supabase.co` en local si quieres.

Ejemplo (sustituye password y host del pooler):

```env
DATABASE_URL="postgresql://postgres.fcecrahllkwyjycstbis:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres.fcecrahllkwyjycstbis:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

### Red Celo (testnet)

```env
NEXT_PUBLIC_CELO_NETWORK=sepolia
CELO_NETWORK=sepolia
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
```

### Contratos y tesorería

Copia desde tu `.env` local (mismos valores que ya usas):

- `TCOPM_ADDRESS` / `NEXT_PUBLIC_TCOPM_ADDRESS`
- `USDC_ADDRESS` / `NEXT_PUBLIC_USDC_ADDRESS`
- `RECOVERY_CONTRACT_ADDRESS` / `NEXT_PUBLIC_RECOVERY_CONTRACT_ADDRESS`
- `REWARDS_CONTRACT_ADDRESS` / `NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS`
- `REWARDS_AUTOMATOR_ADDRESS` (opcional — wallet del cron)
- `CRON_SECRET` — protege `/api/cron/seasons`
- `RECOVERY_TREASURY_ADDRESS` / `NEXT_PUBLIC_RECOVERY_TREASURY`
- `RECOVERY_PRICE_USD_CENTS=10`
- `NEXT_PUBLIC_RECOVERY_PRICE_USD_CENTS=10`

### Servidor (secreto — solo Production)

- `DEPLOYER_PRIVATE_KEY` — pagos admin, recompensas USDC, envío de tokens  
  **Nunca** marques esta variable como expuesta al cliente.

### Producción — flags que deben quedar así

```env
RECOVERY_DEMO_MODE=false
NEXT_PUBLIC_RECOVERY_DEMO_MODE=false
```

**No** definas `ALLOW_DAILY_CHALLENGE_RETRY` en producción pública salvo demos controladas (ver abajo).

### Demo en Vercel (repetir reto del día)

Solo para presentaciones, añade en **Environment Variables → Production**:

```env
ALLOW_DAILY_CHALLENGE_RETRY=true
```

Luego **Redeploy**. Permite volver a jugar el reto del mismo día sin esperar al reinicio. Quítala cuando la app esté abierta al público.

### URL de la app

Tras el **primer** deploy tendrás algo como `https://celoquest-xxx.vercel.app`. Luego:

```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

Añádela en Vercel y haz **Redeploy**.

---

## 3. Primer deploy

1. Guarda todas las variables (Production + Preview si quieres previews con DB)
2. **Deploy**
3. Si falla el build:
   - Revisa `DATABASE_URL` / `DIRECT_URL` y que Supabase permita conexiones
   - Logs: `prisma migrate deploy` necesita `DIRECT_URL` válida

Comprueba: `https://tu-app.vercel.app/api/health` → `{ "ok": true, ... }`

---

## 4. Post-deploy (una sola vez)

Ejecuta **desde tu máquina** contra la misma base de datos de producción:

```bash
# Cargar preguntas (33 ítems ES/EN)
npm run db:seed

# Si ya había datos y quieres forzar:
# npm run db:seed:force
```

### Fondear recompensas USDC

1. Despliega `CeloQuestRewards` con USDC: `npm run contracts:deploy:rewards`
2. Transfiere USDC al contrato (o `deposit` como owner)
3. Configura `CRON_SECRET` en Vercel — el cron en `vercel.json` llama `/api/cron/seasons` cada lunes
4. El admin puede forzar pago manual desde el panel (usa `finalizeSeasonRewardForced`)

---

## 5. Checklist “90% listo”

| Área | Estado tras seguir esta guía |
|------|------------------------------|
| App web (quiz, XP, ranking) | ✅ |
| DB Supabase + migraciones en build | ✅ |
| Preguntas (seed manual) | ✅ tras `db:seed` |
| Recuperación de vidas on-chain | ✅ si contratos en env |
| Recompensas semanales (3 USDC) | ✅ cron + admin force |
| Logros personales (in-app) | ✅ |
| Dominio custom | Opcional (Vercel → Domains) |

---

## 6. Cambios mínimos después

Solo tendrás que tocar Vercel/env cuando:

- Cambies de **Sepolia → mainnet** (ver `docs/MAINNET_MIGRATION.md`)
- Redespliegues **nuevos contratos**
- Añadas **dominio propio** → actualiza `NEXT_PUBLIC_APP_URL`, `nft:sync`, `setBaseURI`
- Rote **DEPLOYER_PRIVATE_KEY** (seguridad)

---

## 7. CLI opcional

```bash
npx vercel login
npx vercel link          # en la carpeta celoquest
npx vercel env pull .env.vercel.local
npx vercel --prod
```

---

## 8. Seguridad

- `.env` local **no** se sube a git (está en `.gitignore`)
- `DEPLOYER_PRIVATE_KEY` solo en Vercel → Environment Variables → Production
- Admin por wallet: `0x089189b7942588bdbadcc5cfc8e76d8bd1073bd4` (migración inicial)

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Build falla en `migrate deploy` | `DIRECT_URL` correcta; IP allowlist en Supabase |
| App lenta / too many connections | Usa pooler en `DATABASE_URL`, no directo |
| Reto diario repetible en prod | No debería pasar; `NODE_ENV=production` bloquea retry |
| NFT sin imagen en wallet | `localhost` en metadata → pasos NFT arriba |
| Sin preguntas | `npm run db:seed` contra prod DB |
| Recovery no funciona | Revisa contratos + treasury en env |
