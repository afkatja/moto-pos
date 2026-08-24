# React Components

The `@moto-pos/core/react` package provides ready-to-use React components for MOTO POS integration.

## Components Overview

### MotoChargePanel

A complete charge form with amount, currency, payment method, and idempotency key fields.

```tsx
import { MotoChargePanel } from '@moto-pos/core/react'
import '@moto-pos/core/tokens.css'

function Checkout() {
  return (
    <MotoChargePanel
      defaultAmount={1000} // cents
      defaultCurrency="usd"
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
| `defaultAmount` | `number` | `0` | Initial amount in cents |
| `defaultCurrency` | `string` | `'usd'` | Initial currency code |
| `onSuccess` | `(result) => void` | — | Called on successful payment |
| `onError` | `(error) => void` | — | Called on payment error |
| `onRequiresAction` | `(clientSecret, paymentIntentId) => void` | — | Called when SCA is required |
| `disabled` | `boolean` | `false` | Disable the entire form |
| `className` | `string` | `''` | Additional CSS classes |

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
            defaultAmount={5000}
            defaultCurrency="usd"
          />
        </div>
      </StringsProvider>
    </QueryClientProvider>
  )
}
```