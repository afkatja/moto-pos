# React API Reference

React components and hooks for integrating MOTO POS into React applications.

## Components

- **PaymentElement** - Stripe Payment Element wrapper
- **StatusAlert** - Payment status display component
- **MotoPosProvider** - Context provider for MotoPos state

## Hooks

- **useMotoPos** - Access MotoPos instance from context
- **usePaymentIntent** - Manage payment intent state
- **useIdempotency** - Handle idempotency keys

## Quick Start

```tsx
import { MotoPosProvider, PaymentElement, useMotoPos } from '@moto-pos/core/react';

function App() {
  return (
    <MotoPosProvider config={{ publishableKey: 'pk_test_...' }}>
      <CheckoutForm />
    </MotoPosProvider>
  );
}

function CheckoutForm() {
  const { createPaymentIntent } = useMotoPos();
  
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      const pi = await createPaymentIntent({ amount: 1000, currency: 'usd' });
    }}>
      <PaymentElement />
      <button type="submit">Pay</button>
    </form>
  );
}
```

## Detailed Documentation

For complete API documentation with all props, types, and methods, see the [generated TypeDoc reference](/api-typedoc/modules/react.html).