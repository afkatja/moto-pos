# Core API Reference

The core module provides the main MOTO POS functionality for Stripe payment processing.

## Overview

- **MotoPos** - Main class for creating and managing payment intents
- **createMotoPos** - Factory function to create a MotoPos instance
- **MotoPosConfig** - Configuration interface for MotoPos

## Quick Start

```typescript
import { createMotoPos } from '@moto-pos/core';

const motoPos = createMotoPos({
  publishableKey: 'pk_test_...',
  // optional configuration
});

const paymentIntent = await motoPos.createPaymentIntent({
  amount: 1000,
  currency: 'usd',
});
```

## Detailed Documentation

For complete API documentation with all types, methods, and options, see the [generated TypeDoc reference](/api-typedoc/modules/).