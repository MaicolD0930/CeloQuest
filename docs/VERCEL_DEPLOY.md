# Despliegue en Vercel (CeloQuest)

Guía para producción en **Celo Mainnet** (USDC + cCOP).

## Requisitos previos

- Repo en GitHub: `MaicolD0930/CeloQuest` (raíz = carpeta `celoquest`)
- Proyecto Supabase con PostgreSQL
- Contratos desplegados en Celo Mainnet (recovery + rewards)
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
- **DIRECT_URL** → *Session pooler* puerto **5432** en el mismo host `pooler.supabase.com`

Ejemplo (sustituye password y host del pooler):

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require"
```

### Red Celo (mainnet)

```env
NEXT_PUBLIC_CELO_NETWORK=mainnet
CELO_NETWORK=mainnet
CELO_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org
```

### Contratos, tokens y tesorería

```env
RECOVERY_TREASURY_ADDRESS=0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4
NEXT_PUBLIC_RECOVERY_TREASURY=0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4

RECOVERY_CONTRACT_ADDRESS=0x3e67516C6809162124411f5e88D16EE75e738983
NEXT_PUBLIC_RECOVERY_CONTRACT_ADDRESS=0x3e67516C6809162124411f5e88D16EE75e738983

REWARDS_CONTRACT_ADDRESS=0xA975A17D5f6D3a081Ad617b437867eF0CfD27F95
NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS=0xA975A17D5f6D3a081Ad617b437867eF0CfD27F95
REWARDS_AUTOMATOR_ADDRESS=0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4

USDC_ADDRESS=0xcebA9300f2b948710d2653dD7B07f33A8B32118C
NEXT_PUBLIC_USDC_ADDRESS=0xcebA9300f2b948710d2653dD7B07f33A8B32118C

CCOPM_ADDRESS=0x8A567e2aE79CA692Bd748aB832081C45de4041eA
NEXT_PUBLIC_CCOPM_ADDRESS=0x8A567e2aE79CA692Bd748aB832081C45de4041eA

RECOVERY_PRICE_USD_CENTS=1
NEXT_PUBLIC_RECOVERY_PRICE_USD_CENTS=1
RECOVERY_CCOPM_FIXED=10
NEXT_PUBLIC_RECOVERY_CCOPM_FIXED=10
```

### Servidor (secreto — solo Production)

- `DEPLOYER_PRIVATE_KEY` — pagos admin, recompensas USDC, envío de tokens  
  **Nunca** marques esta variable como expuesta al cliente.
- `CRON_SECRET` — protege `/api/cron/seasons`

### Flags de producción

```env
RECOVERY_DEMO_MODE=false
NEXT_PUBLIC_RECOVERY_DEMO_MODE=false
```

Reintentos del reto diario (pitch/demo):

```env
ALLOW_DAILY_CHALLENGE_RETRY=true   # activo en mainnet por defecto en código
ALLOW_DAILY_CHALLENGE_RETRY=false  # un intento/día
```

### URL de la app

```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

Añádela en Vercel y haz **Redeploy** tras el primer deploy.

---

## 3. Primer deploy

1. Guarda todas las variables (Production + Preview si quieres previews con DB)
2. **Deploy**
3. Si falla el build:
   - Revisa `DATABASE_URL` / `DIRECT_URL` y que Supabase permita conexiones
   - Logs: `prisma migrate deploy` necesita `DIRECT_URL` válida

Comprueba: `https://tu-app.vercel.app/api/health` → `{ "ok": true, "network": "mainnet", "dbOk": true, ... }`

---

## 4. Post-deploy (una sola vez)

Ejecuta **desde tu máquina** contra la misma base de datos de producción:

```bash
npm run db:seed
```

### Fondear recompensas USDC

1. Transfiere USDC al contrato `CeloQuestRewards` (o `deposit` como owner)
2. El cron en `vercel.json` llama `/api/cron/seasons` cada lunes
3. El admin puede forzar pago manual desde el panel (`finalizeSeasonRewardForced`)

---

## 5. Checklist producción

| Área | Estado |
|------|--------|
| App web (quiz, XP, ranking) | ✅ |
| DB Supabase + migraciones en build | ✅ |
| Preguntas (`db:seed`) | ✅ tras seed manual |
| Recuperación de vidas (USDC / cCOP → treasury) | ✅ con env correcto |
| Recompensas semanales USDC | ✅ cron + admin force |
| Logros personales (in-app) | ✅ |
| Dominio custom | Opcional (Vercel → Domains) |

---

## 6. Flujo de pagos en producción

**Recuperación de vida:** transferencia directa USDC o cCOP al treasury. El backend verifica el recibo on-chain y restaura 1 vida.

**Premio semanal:** `CeloQuestRewards.finalizeSeasonReward` envía USDC al campeón (#1 del ranking).

---

## 7. CLI opcional

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.vercel.local
npx vercel --prod
```

---

## 8. Seguridad

- `.env` local **no** se sube a git (está en `.gitignore`)
- `DEPLOYER_PRIVATE_KEY` solo en Vercel → Environment Variables → Production
- Admin por wallet: `0x089189B7942588bDBAdcc5cFc8E76d8bd1073bd4`

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Build falla en `migrate deploy` | `DIRECT_URL` correcta; IP allowlist en Supabase |
| App lenta / too many connections | Usa pooler en `DATABASE_URL`, no directo |
| `/api/health` muestra `sepolia` | Corrige `CELO_NETWORK` y `NEXT_PUBLIC_CELO_NETWORK` en Vercel |
| Sin preguntas | `npm run db:seed` contra prod DB |
| USDC funciona, cCOP no | Revisa `CCOPM_ADDRESS` y saldo cCOP del usuario |
| Recovery no verifica | Revisa `RECOVERY_TREASURY_ADDRESS` y monto esperado (0.01 USDC / 10 cCOP) |
| Premio no paga | Fondea `CeloQuestRewards` con USDC; revisa `CRON_SECRET` y `REWARDS_AUTOMATOR_ADDRESS` |
