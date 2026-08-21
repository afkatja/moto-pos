# @moto-pos/core

Standalone MOTO POS module for Stripe payment processing with pluggable idempotency store.

## Features

- **Pure TypeScript** - Zero runtime dependencies (peer: React, Stripe)
- **MOTO (Mail Order/Telephone Order)** - Stripe PaymentIntents with `moto: true` for VCC processing
- **Pluggable Idempotency Store** - In-memory, Postgres, Redis, or Supabase
- **Framework-agnostic HTTP handler** - Works with Next.js, Express, Hono, etc.
- **Self-contained React UI** - `MotoChargePanel` with primitives (Input, Button, Select, StatusAlert, Card)
- **CSS Custom Properties theming** - Light/dark mode, zero runtime, no Tailwind required
- **i18n support** - `StringsProvider` / `useStrings` with nested keys
- **Admin auth** - Supabase JWT with `app_metadata.role === 'admin'` (zero-DB)

---

## Installation

```bash
npm install @moto-pos/core @tanstack/react-query
# peer deps:
npm install react@18 stripe@14
```

---

## Quick Start (Next.js)

```tsx
// app/api/pos/charge/route.ts
import { createNextRouteHandler } from '@moto-pos/core/http/next'
import { createStripeAdapter } from '@moto-pos/core/adapters/stripe-adapter'
import { createSupabaseAuthProvider } from '@moto-pos/core/adapters/supabase-auth'

const stripe = createStripeAdapter(process.env.STRIPE_API_KEY!)
const auth = createSupabaseAuthProvider(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  process.env.SUPABASE_JWT_SECRET
)

export const POST = createNextRouteHandler({ stripe, auth })
```

```tsx
// app/components/ChargeWidget.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StringsProvider } from '@moto-pos/core/strings'
import { MotoChargePanel } from '@moto-pos/core/react'
import '@moto-pos/core/tokens.css'

const queryClient = new QueryClient()

export function ChargeWidget({ defaultAmount = 100, defaultCurrency = 'usd' }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StringsProvider>
        <div className="moto-pos">
          <MotoChargePanel
            defaultAmount={defaultAmount * 100} // dollars → cents
            defaultCurrency={defaultCurrency}
          />
        </div>
      </StringsProvider>
    </QueryClientProvider>
  )
}
```

---

## Idempotency Store

The module accepts an optional `IdempotencyStore` for stronger duplicate-charge protection beyond Stripe's 24h window.

```tsx
// With custom store
import { InMemoryIdempotencyStore } from '@moto-pos/core/store'

const store = new InMemoryIdempotencyStore({ defaultTtlMs: 24 * 60 * 60 * 1000 })

// In your route
export const POST = createNextRouteHandler({ stripe, auth, idempotencyStore: store })
```

### Available Stores

| Store | Package | Use Case |
|-------|---------|----------|
| `InMemoryIdempotencyStore` | Built-in | Tests, single-instance |
| `PostgresIdempotencyStore` | `pg` | Production (Postgres) |
| `RedisIdempotencyStore` | `redis` | Distributed / multi-instance |
| `SupabaseIdempotencyStore` | `@supabase/supabase-js` | Supabase projects |

```tsx
// Postgres
import { PostgresIdempotencyStore } from '@moto-pos/core/store'
const store = new PostgresIdempotencyStore({ connectionString: process.env.DATABASE_URL })
await store.initialize()

// Redis
import { RedisIdempotencyStore } from '@moto-pos/core/store'
const store = new RedisIdempotencyStore({ url: process.env.REDIS_URL })
await store.connect()

// Supabase
import { SupabaseIdempotencyStore } from '@moto-pos/core/store'
const store = new SupabaseIdempotencyStore({
  url: process.env.SUPABASE_URL!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
})
await store.initialize()
```

---

## Idempotency Key Format

```
{prefix}:{internal_id}:{amount_cents}:{currency}
```

**Examples:**
- `booking-vcc:res_123:150000:usd`
- `booking-vcc:manual_abc:50000:eur`

Configure prefix via `MOTO_POS_IDEMPOTENCY_PREFIX` (default: `booking-vcc`).

---

## React UI Components

### MotoChargePanel

Complete manual-entry charge form with amount, currency, payment method, idempotency key.

```tsx
import { MotoChargePanel } from '@moto-pos/core/react'

<MotoChargePanel
  defaultAmount={15000} // $150.00
  defaultCurrency="usd"
  onSuccess={(result) => console.log('Success:', result)}
  onError={(error) => console.error('Error:', error)}
  onRequiresAction={(clientSecret, paymentIntentId) => {
    // Handle 3D Secure
  }}
/>
```

### Primitives

```tsx
import { Input, Button, Select, StatusAlert, Card, CardHeader, CardTitle, CardContent } from '@moto-pos/core/react'
```

### Theming

```tsx
import { StringsProvider, useStrings } from '@moto-pos/core/strings'
import { defaultTokens } from '@moto-pos/core/tokens'

// Override strings
const customStrings = {
  panel: {
    title: 'Cobro Manual',
    chargeButton: 'Cargar',
  }
}

<StringsProvider strings={customStrings}>
  <MotoChargePanel />
</StringsProvider>

// Custom tokens
import { createTokenStyles } from '@moto-pos/core/tokens'
const customCSS = createTokenStyles({
  colors: { primary: '#your-brand' }
})
```

```css
/* Or in globals.css */
:root {
  --moto-pos-color-primary: #your-brand;
}
```

---

## Supabase Auth

```tsx
import { createSupabaseAuthProvider } from '@moto-pos/core/adapters/supabase-auth'

const auth = createSupabaseAuthProvider(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  process.env.SUPABASE_JWT_SECRET // optional: enables zero-DB JWT verification
)

// In your route
export const POST = createNextRouteHandler({ stripe, auth })
```

### Admin Promotion

```bash
npx tsx scripts/set-admin.ts \
  --email admin@example.com \
  --project your-project-ref \
  --service-key sk_...
```

---

## WordPress Integration

See [docs/wp-react-integration.md](docs/wp-react-integration.md) for complete guide:

- Stripe.js VCC token creation on WP
- WP REST API proxy to Next.js `/api/pos/charge`
- Shortcode `[moto_pos_charge amount="150" currency="usd" reservation="RES-123"]`
- iframe fallback option

---

## HTTP API Contract

See [docs/http-api.md](docs/http-api.md) for full spec.

**Endpoint:** `POST /api/pos/charge`

**Headers:** `Authorization: Bearer <JWT>`, `Content-Type: application/json`

**Request:**
```json
{
  "amount": 150000,
  "currency": "usd",
  "paymentMethodId": "pm_card_visa",
  "idempotencyKey": "booking-vcc:res_123:150000:usd",
  "description": "Booking.com VCC reservation RES-123",
  "metadata": { "reservation_id": "res_123", "source": "booking_com_vcc" }
}
```

**Success (200):**
```json
{ "paymentIntentId": "pi_3Rq9...", "status": "succeeded" }
```

**Requires Action (422):**
```json
{
  "error": "Payment requires additional authentication (3D Secure)",
  "status": "requires_action",
  "clientSecret": "pi_3Rq9..._secret_xyz",
  "paymentIntentId": "pi_3Rq9..."
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STRIPE_API_KEY` | **required** | Stripe secret key |
| `MOTO_POS_MAX_AMOUNT_CENTS` | `1000000` | Max charge amount |
| `MOTO_POS_ALLOWED_CURRENCIES` | `usd,eur,gbp,crc` | Allowed currencies |
| `MOTO_POS_IDEMPOTENCY_PREFIX` | `booking-vcc` | Idempotency key prefix |
| `SUPABASE_URL` | — | Supabase URL for auth |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Supabase service key |
| `SUPABASE_JWT_SECRET` | — | Enables zero-DB JWT verification |

---

## Scripts

```bash
# Admin promotion
npx tsx scripts/set-admin.ts --email admin@example.com --project your-ref --service-key sk_...

# Type-check
npm run type-check

# Lint
npm run lint

# Test
npm test

# Build
npm run build

# Docs
npm run docs:dev
```

---

## License

MIT