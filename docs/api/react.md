# React API Reference

React components and hooks for integrating MOTO POS into React applications.

## Components

- **MotoChargePanel** - Complete MOTO charge form with amount, currency, and Stripe CardElement
- **Card / CardHeader / CardContent / CardTitle** - Container components
- **Input** - Form input with label, helper text, error states
- **Select** - Dropdown select with options
- **Button** - Primary/secondary buttons with loading states
- **StatusAlert** - Toast-style alerts (success, error, warning, info)

## Hooks

- **useCharge** - TanStack Query mutation for creating charges
- **useStrings** - Access localized strings from StringsContext

## MotoChargePanel

```tsx
import { MotoChargePanel } from '@moto-pos/core/react'
import '@moto-pos/core/tokens.css'

function Checkout() {
  return (
    <MotoChargePanel
      defaultAmount={1000} // cents
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

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultAmount` | `number` | `0` | Initial amount in cents |
| `defaultCurrency` | `string` | `'usd'` | Initial currency code |
| `publishableKey` | `string` | **required** | Stripe publishable key for client-side Stripe initialization |
| `idempotencyPrefix` | `string` | `'booking-vcc'` | Prefix for generated idempotency keys |
| `onSuccess` | `(result) => void` | — | Called on successful payment |
| `onError` | `(error) => void` | — | Called on payment error |
| `onRequiresAction` | `(clientSecret, paymentIntentId) => void` | — | Called when SCA is required |
| `disabled` | `boolean` | `false` | Disable the entire form |
| `className` | `string` | `''` | Additional CSS classes |

### Result Types

```ts
type ChargeResult = {
  paymentIntentId: string
  status: 'succeeded' | 'requires_action' | 'failed'
  clientSecret?: string
}
```

## useCharge Hook

```tsx
import { useCharge } from '@moto-pos/core/react/hooks/useCharge'

function MyComponent() {
  const chargeMutation = useCharge({
    onSuccess: (result) => {},
    onError: (error) => {},
    endpoint: '/api/pos/charge', // optional, defaults to '/api/pos/charge'
  })

  chargeMutation.mutate({
    amount: 1000,
    currency: 'usd',
    paymentMethodId: 'pm_...',
    idempotencyKey: 'booking-vcc:123:1000:usd',
  })
}
```

### useCharge Options

| Option | Type | Description |
|--------|------|-------------|
| `onSuccess` | `(result) => void` | Called on successful charge |
| `onError` | `(error) => void` | Called on charge error |
| `onSettled` | `(result, error) => void` | Called when mutation settles |
| `endpoint` | `string` | API endpoint (default: `/api/pos/charge`) |

### Return Value

Returns a TanStack Query `UseMutationResult` with:
- `mutate` - Trigger the charge
- `mutateAsync` - Async version
- `isPending` - Loading state
- `isSuccess` / `isError` - Status
- `data` / `error` - Result or error

## StringsProvider / useStrings

```tsx
import { StringsProvider, useStrings } from '@moto-pos/core/strings'

function App() {
  return (
    <StringsProvider>
      <MyComponent />
    </StringsProvider>
  )
}

function MyComponent() {
  const { t } = useStrings()
  return <h1>{t('panel.title')}</h1>
}
```

## Detailed Documentation

For complete API documentation with all props, types, and methods, see the [generated TypeDoc reference](/api-typedoc/modules/react.html).