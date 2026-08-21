# Idempotency Stores

The module accepts an optional `IdempotencyStore` for stronger duplicate-charge protection beyond Stripe's 24h window.

## Usage

```tsx
import { InMemoryIdempotencyStore } from '@moto-pos/core/store'

const store = new InMemoryIdempotencyStore({ defaultTtlMs: 24 * 60 * 60 * 1000 })

// In your route
export const POST = createNextRouteHandler({ stripe, auth, idempotencyStore: store })
```

## Available Stores

| Store | Package | Use Case |
|-------|---------|----------|
| `InMemoryIdempotencyStore` | Built-in | Tests, single-instance |
| `PostgresIdempotencyStore` | `pg` | Production (Postgres) |
| `RedisIdempotencyStore` | `redis` | Distributed / multi-instance |
| `SupabaseIdempotencyStore` | `@supabase/supabase-js` | Supabase projects |

## Examples

### Postgres

```tsx
import { PostgresIdempotencyStore } from '@moto-pos/core/store'
const store = new PostgresIdempotencyStore({ connectionString: process.env.DATABASE_URL })
await store.initialize()
```

### Redis

```tsx
import { RedisIdempotencyStore } from '@moto-pos/core/store'
const store = new RedisIdempotencyStore({ url: process.env.REDIS_URL })
await store.connect()
```

### Supabase

```tsx
import { SupabaseIdempotencyStore } from '@moto-pos/core/store'
const store = new SupabaseIdempotencyStore({
  url: process.env.SUPABASE_URL!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})
await store.initialize()
```

## Idempotency Key Format

```
{prefix}:{internal_id}:{amount_cents}:{currency}
```

**Examples:**
- `booking-vcc:res_123:150000:usd`
- `booking-vcc:manual_abc:50000:eur`

Configure prefix via `MOTO_POS_IDEMPOTENCY_PREFIX` (default: `booking-vcc`).