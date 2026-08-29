---
layout: doc
title: UI Preview - @moto-pos/core
description: Interactive preview of the MotoChargePanel component
---

# UI Preview

Interactive demo of the **MotoChargePanel** component — the standalone MOTO POS charge component with idempotency, i18n, and theming built in.

> **Note:** The CardElement requires a valid Stripe publishable key to function. The demo below uses a placeholder key and will show a warning. To test the Stripe integration, pass a real test key (starting with `pk_test_`) from your [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys).

<MotoChargePanel
  :defaultAmount="150"
  defaultCurrency="usd"
  :publishableKey="'pk_test_51QPE2rKrlqDRfFCKNsCBTGmSJ2xwtbX4qYiqYfojLqHmj5SFjm81n88cEdocqzA72mXaumnvOrClcbNLVfguZRBs00uDgSApfN'"
/>

## Test Payment Methods

Use these Stripe test PaymentMethod IDs to simulate different outcomes:

| PaymentMethod ID    | Behavior                     |
| ------------------- | ---------------------------- |
| `pm_card_visa`      | ✅ Succeeds                  |
| `pm_card_visa_fail` | ❌ Fails                     |
| `pm_card_3ds`       | 🔐 Requires 3D Secure action |

## Integration in Consumer Project

### Required Props

The `MotoChargePanel` requires a **Stripe publishable key** to initialize the CardElement:

```tsx
import { MotoChargePanel } from "@moto-pos/core/react"
import "@moto-pos/core/tokens.css"

function Checkout() {
  return (
    <MotoChargePanel
      defaultAmount={150.00} // Amount in major currency unit (150.00 = $150.00)
      defaultCurrency="usd"
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      idempotencyPrefix="booking-vcc" // Optional: prefix for idempotency keys
      onSuccess={result => console.log("Payment succeeded:", result)}
      onError={error => console.error("Payment failed:", error)}
      onRequiresAction={(clientSecret, paymentIntentId) => {
        // Handle 3D Secure / SCA
        // stripe.handleCardAction(clientSecret)
      }}
    />
  )
}
```

### Props

| Prop                | Type                                      | Default         | Description                                                   |
| ------------------- | ----------------------------------------- | --------------- | ------------------------------------------------------------- |
| `defaultAmount`     | `number`                                  | `0`             | Initial amount in major currency unit (e.g., 150 for $150.00) |
| `defaultCurrency`   | `string`                                  | `'usd'`         | Initial currency code                                         |
| `publishableKey`    | `string`                                  | **required**    | Stripe publishable key (e.g., `pk_test_...` or `pk_live_...`) |
| `idempotencyPrefix` | `string`                                  | `'booking-vcc'` | Prefix for generated idempotency keys                         |
| `onSuccess`         | `(result) => void`                        | —               | Called on successful payment                                  |
| `onError`           | `(error) => void`                         | —               | Called on payment error                                       |
| `onRequiresAction`  | `(clientSecret, paymentIntentId) => void` | —               | Called when 3D Secure is required                             |
| `disabled`          | `boolean`                                 | `false`         | Disable the entire form                                       |
| `className`         | `string`                                  | `''`            | Additional CSS classes                                        |

### Local Testing Setup

To test the integration locally:

1. **Create a Stripe account** at [stripe.com](https://stripe.com) and get your test keys from the [Dashboard](https://dashboard.stripe.com/test/apikeys)

2. **Set environment variables** in your consumer project:

```bash
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

3. **Configure the backend API endpoint** (the component POSTs to `/api/pos/charge` by default):

```tsx
// In your app, ensure this API route exists or customize via useCharge hook
// The backend should create a MOTO PaymentIntent with payment_method_options.card.moto: true
```

4. **Run the demo locally** (if using this package directly):

```bash
# In @moto-pos/core
npm run dev    # Starts Storybook/UI preview at http://localhost:6006
```

## Source Code

The demo uses the same component you'd import in your app:

```tsx
import { MotoChargePanel } from "@moto-pos/core/react"
import "@moto-pos/core/tokens.css"

return (
  <MotoChargePanel
    defaultAmount={150.00}
    defaultCurrency="usd"
    publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
  />
)
```

The idempotency key is generated automatically using the format `prefix:uuid` (e.g., `booking-vcc:550e8400-e29b-41d4-a716-446655440000`). Configure the prefix via the `idempotencyPrefix` prop or `MOTO_POS_IDEMPOTENCY_PREFIX` environment variable.
