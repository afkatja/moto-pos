# Strings API Reference

Localization and string customization for MOTO POS components.

## StringsContext

Provides localized strings to all MOTO POS components via React Context.

```typescript
import { StringsProvider, defaultStrings } from '@moto-pos/core/strings';

<MotoPosProvider config={{ publishableKey: 'pk_test_...' }}>
  <StringsProvider strings={{ ...defaultStrings, payButton: 'Pay Now' }}>
    <App />
  </StringsProvider>
</MotoPosProvider>
```

## Default Strings

```typescript
const defaultStrings = {
  payButton: 'Pay',
  processing: 'Processing...',
  success: 'Payment successful!',
  error: 'Payment failed. Please try again.',
  cardNumber: 'Card number',
  expiryDate: 'MM/YY',
  cvc: 'CVC',
  // ... more strings
};
```

## Customization

Override any string by providing a partial strings object:

```tsx
<StringsProvider strings={{
  payButton: 'Complete Purchase',
  processing: 'Authorizing...',
  success: 'Order confirmed!',
}}>
  <CheckoutForm />
</StringsProvider>
```

## Hook

```typescript
import { useStrings } from '@moto-pos/core/strings';

function CustomButton() {
  const strings = useStrings();
  return <button>{strings.payButton}</button>;
}
```

## Detailed Documentation

For complete API documentation with all available strings, see the [generated TypeDoc reference](/api-typedoc/modules/strings.html).