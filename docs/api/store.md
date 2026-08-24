# Store API Reference

Pluggable idempotency stores for preventing duplicate payment requests.

## Built-in Stores

- **MemoryIdempotencyStore** - In-memory store (default, for single-instance deployments)
- **RedisIdempotencyStore** - Redis-backed store for distributed deployments
- **PgIdempotencyStore** - PostgreSQL-backed store for persistent storage

## Interface

```typescript
interface IdempotencyStore {
  get(key: string): Promise<IdempotencyRecord | null>;
  set(key: string, record: IdempotencyRecord): Promise<void>;
  delete(key: string): Promise<void>;
}
```

## Usage

```typescript
import { createMotoPos, RedisIdempotencyStore } from '@moto-pos/core';
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const motoPos = createMotoPos({
  publishableKey: 'pk_test_...',
  idempotencyStore: new RedisIdempotencyStore(redis),
});
```

## Custom Stores

Implement the `IdempotencyStore` interface to create custom stores for other backends (DynamoDB, MongoDB, etc.).

## Detailed Documentation

For complete API documentation with all types and methods, see the [generated TypeDoc reference](/api-typedoc/modules/store.html).