# Getting Started

## Installation

```bash
npm install @moto-pos/core @tanstack/react-query
# peer deps:
npm install react stripe -D
```

## Quick Start (Next.js)

### API Route

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

### React Component

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