# Supabase Auth Integration

MOTO POS provides a Supabase authentication adapter for securing your payment endpoints.

## Overview

The `createSupabaseAuthProvider` function creates an `AuthProvider` that:

1. Verifies Supabase JWT tokens from the `Authorization: Bearer <token>` header
2. Optionally validates JWTs locally using `SUPABASE_JWT_SECRET` (zero-DB mode)
3. Falls back to Supabase Admin API for token verification
4. Extracts user ID, email, and admin status from claims

## Installation

```bash
npm install @supabase/supabase-js
# peer dependency
```

## Setup

```typescript
// lib/auth.ts
import { createSupabaseAuthProvider } from '@moto-pos/core/adapters/supabase-auth'

export const auth = createSupabaseAuthProvider(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  process.env.SUPABASE_JWT_SECRET // optional: enables zero-DB verification
)
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (admin access) |
| `SUPABASE_JWT_SECRET` | No | JWT secret for local token validation (zero-DB) |

### Zero-DB Mode (Recommended)

When `SUPABASE_JWT_SECRET` is provided, the adapter validates tokens locally without calling Supabase API:

```typescript
// Faster - no network call to Supabase
export const auth = createSupabaseAuthProvider(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  process.env.SUPABASE_JWT_SECRET // enables local JWT validation
)
```

Get your JWT secret from Supabase Dashboard → Settings → API → JWT Secret.

## Usage with Route Handlers

### Next.js App Router

```typescript
// app/api/pos/charge/route.ts
import { createNextRouteHandler } from '@moto-pos/core/http/next'
import { createStripeAdapter } from '@moto-pos/core/adapters/stripe-adapter'
import { auth } from '@/lib/auth'

const stripe = createStripeAdapter(process.env.STRIPE_API_KEY!)

export const POST = createNextRouteHandler({
  stripe,
  auth,
  // Optional: require admin for certain operations
  // adminOnly: true,
})
```

### Protecting Routes

The adapter provides two verification functions:

```typescript
import { auth } from '@/lib/auth'

// In a custom route or middleware
const user = await auth.verifyUser(request)
// Returns: { id: string, email: string, isAdmin: boolean }

const admin = await auth.verifyAdmin(request)
// Throws 403 if not admin, returns user if admin
```

## Admin Detection

A user is considered an admin if their JWT contains:

- `app_metadata.role === 'admin'`
- OR `app_metadata.roles` array includes `'admin'`

Set this in Supabase Dashboard → Authentication → Users → Edit user → User Metadata, or via SQL:

```sql
-- Set admin role
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@example.com';
```

## Error Handling

The adapter throws typed errors with HTTP status codes:

```typescript
try {
  const user = await auth.verifyUser(req)
} catch (error) {
  if (error.status === 401) {
    // Missing/invalid token
  } else if (error.status === 403) {
    // Not admin (from verifyAdmin)
  }
}
```

## Client-Side Token Usage

In React components, include the Supabase access token:

```tsx
import { useSession } from '@supabase/auth-helpers-react'
import { useCharge } from '@moto-pos/core/react/hooks/useCharge'

function PaymentForm() {
  const { session } = useSession()
  const chargeMutation = useCharge()

  const handlePay = async () => {
    chargeMutation.mutate({
      amount: 1000,
      currency: 'usd',
      paymentMethodId: 'pm_...',
      idempotencyKey: 'booking-vcc:123:1000:usd',
    }, {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      }
    })
  }
}
```

## Complete Next.js Example

```typescript
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

export function ChargeWidget() {
  return (
    <QueryClientProvider client={queryClient}>
      <StringsProvider>
        <MotoChargePanel defaultAmount={5000} defaultCurrency="usd" />
      </StringsProvider>
    </QueryClientProvider>
  )
}
```