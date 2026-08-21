// Main types entry point - all types are defined in this file
import type Stripe from 'stripe'

export interface ChargeInput {
  amount: number
  currency: string
  paymentMethodId: string
  idempotencyKey: string
  description?: string
  metadata?: Record<string, string>
}

export interface ChargeResult {
  paymentIntentId: string
  status: 'succeeded' | 'requires_action' | 'failed'
  clientSecret?: string
}

export interface AuthUser {
  id: string
  email?: string
  isAdmin: boolean
}

export interface AuthProvider {
  verifyUser(req: HttpRequestLike): Promise<AuthUser>
  verifyAdmin(req: HttpRequestLike): Promise<AuthUser>
}

export interface ModuleConfig {
  maxAmountCents: number
  allowedCurrencies: string[]
  idempotencyPrefix: string
}

export interface HttpRequestLike {
  method: string
  headers: Headers
  json(): Promise<unknown>
}

export interface HttpResponseLike {
  status: number
  body: unknown
}

export type StripeClient = Pick<
  Stripe,
  'paymentIntents'
>

export interface ValidationError {
  field: string
  message: string
}

export interface IdempotencyRecord {
  key: string
  status: 'pending' | 'succeeded' | 'failed' | 'requires_action'
  paymentIntentId?: string
  clientSecret?: string
  amount: number
  currency: string
  createdAt: number
  updatedAt: number
  expiresAt: number
}

export interface IdempotencyStore {
  get(key: string): Promise<IdempotencyRecord | null>
  set(key: string, record: Omit<IdempotencyRecord, 'key'>): Promise<void>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
}

export interface InMemoryIdempotencyStoreOptions {
  defaultTtlMs?: number
  cleanupIntervalMs?: number
}

export interface PostgresIdempotencyStoreOptions {
  connectionString: string
  tableName?: string
  defaultTtlMs?: number
}

export interface RedisIdempotencyStoreOptions {
  url: string
  keyPrefix?: string
  defaultTtlMs?: number
}

export interface SupabaseIdempotencyStoreOptions {
  url: string
  serviceRoleKey: string
  tableName?: string
  defaultTtlMs?: number
}

export interface ValidationError {
  field: string
  message: string
}