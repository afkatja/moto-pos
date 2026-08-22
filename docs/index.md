---
layout: home

hero:
  name: "@moto-pos/core"
  text: "Standalone MOTO POS Module"
  tagline: "Stripe payment processing with pluggable idempotency store for Mail Order / Telephone Order (VCC) transactions"
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/
    - theme: alt
      text: HTTP API
      link: /http-api

features:
  - title: MOTO / VCC Support
    details: "Built-in Stripe PaymentIntents with `moto: true` for virtual credit card processing"
  - title: Pluggable Idempotency
    details: In-memory, Postgres, Redis, or Supabase stores for duplicate-charge protection
  - title: Framework Agnostic
    details: HTTP handler works with Next.js, Express, Hono, or any Node.js framework
  - title: Self-contained React UI
    details: MotoChargePanel with primitives (Input, Button, Select, StatusAlert, Card)
  - title: CSS Custom Properties Theming
    details: Light/dark mode, zero runtime, no Tailwind required
  - title: i18n Support
    details: StringsProvider / useStrings with nested keys and custom translations
  - title: Admin Auth
    details: Supabase JWT with app_metadata.role === 'admin' (zero-DB verification)
  - title: TypeScript First
    details: Full type safety with peer dependencies for React and Stripe
---

## Quick Install

```bash
npm install @moto-pos/core @tanstack/react-query
# peer deps:
npm install react@latest stripe@latest
```

## 30-Second Setup

```tsx
// API Route (Next.js)
import { createNextRouteHandler } from "@moto-pos/core/http/next"
import { createStripeAdapter } from "@moto-pos/core/adapters/stripe-adapter"
import { createSupabaseAuthProvider } from "@moto-pos/core/adapters/supabase-auth"

const stripe = createStripeAdapter(process.env.STRIPE_API_KEY!)
const auth = createSupabaseAuthProvider(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const POST = createNextRouteHandler({ stripe, auth })
```

```tsx
// React Component
"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StringsProvider } from "@moto-pos/core/strings"
import { MotoChargePanel } from "@moto-pos/core/react"
import "@moto-pos/core/tokens.css"

const queryClient = new QueryClient()

export function ChargeWidget() {
  return (
    <QueryClientProvider client={queryClient}>
      <StringsProvider>
        <MotoChargePanel defaultAmount={15000} defaultCurrency="usd" />
      </StringsProvider>
    </QueryClientProvider>
  )
}
```

## Why @moto-pos/core?

| Feature                  | Benefit                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| **Zero runtime deps**    | Only peer dependencies (React, Stripe)                           |
| **Idempotency built-in** | Prevents duplicate charges beyond Stripe's 24h window            |
| **Framework flexible**   | Use the HTTP handler anywhere, React components in any React app |
| **Production ready**     | Postgres/Redis/Supabase stores for distributed deployments       |
| **Fully typed**          | End-to-end TypeScript with generated API docs                    |

## Next Steps

- [Getting Started Guide](/guide/getting-started) - Full setup with Next.js
- [Idempotency Stores](/guide/idempotency) - Choose and configure your store
- [React Components](/guide/getting-started#react-component) - Customize the UI
- [API Reference](https://your-domain.com/api/) - Complete TypeDoc-generated documentation
