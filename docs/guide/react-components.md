# React Components

The `@moto-pos/core/react` package provides ready-to-use React components for MOTO POS integration.

## Components Overview

### MotoChargePanel

A complete charge form with amount, currency, and Stripe CardElement for secure card input. The component initializes Stripe internally and wraps itself in Elements - no manual wrapper needed.

```tsx
import { MotoChargePanel } from '@moto-pos/core/react'
import '@moto-pos/core/tokens.css'

function Checkout() {
  return (
    <MotoChargePanel
      defaultAmount={10.99} // USD with decimals (converted to cents internally)
      defaultCurrency="usd"
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      onSuccess={(result) => console.log('Payment succeeded:', result)}
      onError={(error) => console.error('Payment failed:', error)}
      onRequiresAction={(clientSecret, paymentIntentId) => {
        // Handle 3D Secure / SCA
        stripe.handleCardAction(clientSecret)
      }}
    />
  )
}
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultAmount` | `number` | `0` | Initial amount in major currency unit (e.g., 10.99 for $10.99) |
| `defaultCurrency` | `string` | `'usd'` | Initial currency code |
| `publishableKey` | `string` | **required** | Stripe publishable key for client-side Stripe initialization |
| `idempotencyPrefix` | `string` | `'booking-vcc'` | Prefix for generated idempotency keys |
| `onSuccess` | `(result) => void` | — | Called on successful payment |
| `onError` | `(error) => void` | — | Called on payment error |
| `onRequiresAction` | `(clientSecret, paymentIntentId) => void` | — | Called when SCA is required |
| `disabled` | `boolean` | `false` | Disable the entire form |
| `className` | `string` | `''` | Additional CSS classes |

### How MOTO Payment Works

1. **Client creates PaymentMethod** - User enters card details in `CardElement`, component calls `stripe.createPaymentMethod({ type: 'card', card })`
2. **Client sends PaymentMethod ID** - Component POSTs to `/api/pos/charge` with `amount`, `currency`, `paymentMethodId`, `idempotencyKey`
3. **Server creates MOTO PaymentIntent** - Backend creates PaymentIntent with `payment_method_options.card.moto: true` and confirms it
4. **Result returned** - Returns `succeeded`, `requires_action` (3D Secure), or `failed`

### Primitive Components

Low-level UI primitives for building custom payment forms:

- **Card / CardHeader / CardContent / CardTitle** - Container components
- **Input** - Form input with label, helper text, error states
- **Select** - Dropdown select with options
- **Button** - Primary/secondary buttons with loading states
- **StatusAlert** - Toast-style alerts (success, error, warning, info)

```tsx
import { Card, Input, Select, Button, StatusAlert } from '@moto-pos/core/react/primitives'
import { useStrings } from '@moto-pos/core/strings'

function CustomPaymentForm() {
  const { t } = useStrings()
  
  return (
    <Card>
      <Input label={t('panel.amountLabel')} type="number" step="0.01" />
      <Select label={t('panel.currencyLabel')} options={[
        { value: 'usd', label: 'USD ($)' },
        { value: 'eur', label: 'EUR (€)' }
      ]} />
      <Button variant="primary" onClick={handleSubmit}>
        {t('panel.chargeButton')}
      </Button>
    </Card>
  )
}
```

### Hooks

- **useCharge** - TanStack Query mutation for creating charges
- **useStrings** - Access localized strings from StringsContext

```tsx
import { useCharge } from '@moto-pos/core/react/hooks/useCharge'

function MyComponent() {
  const chargeMutation = useCharge({
    onSuccess: (result) => {},
    onError: (error) => {},
  })

  chargeMutation.mutate({
    amount: 1000,
    currency: 'usd',
    paymentMethodId: 'pm_...',
    idempotencyKey: 'booking-vcc:123:1000:usd',
  })
}
```

## Complete Example

```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StringsProvider } from '@moto-pos/core/strings'
import { MotoChargePanel } from '@moto-pos/core/react'
import '@moto-pos/core/tokens.css'

const queryClient = new QueryClient()

export function PaymentWidget() {
  return (
    <QueryClientProvider client={queryClient}>
      <StringsProvider>
        <div className="moto-pos">
          <MotoChargePanel
            defaultAmount={50.00}
            defaultCurrency="usd"
            publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
          />
        </div>
      </StringsProvider>
    </QueryClientProvider>
  )
}
```