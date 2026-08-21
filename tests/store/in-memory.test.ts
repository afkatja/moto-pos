import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { InMemoryIdempotencyStore } from '../../src/store/in-memory'
import type { IdempotencyRecord } from '../../src/types'

describe('InMemoryIdempotencyStore', () => {
  let store: InMemoryIdempotencyStore

  beforeEach(() => {
    store = new InMemoryIdempotencyStore({ defaultTtlMs: 1000, cleanupIntervalMs: 100 })
  })

  afterEach(() => {
    store.destroy()
  })

  it('stores and retrieves a record', async () => {
    const record: Omit<IdempotencyRecord, 'key'> = {
      status: 'succeeded',
      paymentIntentId: 'pi_123',
      amount: 1000,
      currency: 'usd',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + 10000,
    }

    await store.set('test-key', record)
    const result = await store.get('test-key')

    expect(result).toBeDefined()
    expect(result?.paymentIntentId).toBe('pi_123')
    expect(result?.status).toBe('succeeded')
  })

  it('returns null for non-existent key', async () => {
    const result = await store.get('non-existent')
    expect(result).toBeNull()
  })

  it('returns null for expired record', async () => {
    const storeWithShortTtl = new InMemoryIdempotencyStore({ defaultTtlMs: 10, cleanupIntervalMs: 5 })
    
    const record: Omit<IdempotencyRecord, 'key'> = {
      status: 'succeeded',
      paymentIntentId: 'pi_123',
      amount: 1000,
      currency: 'usd',
      createdAt: Date.now() - 100,
      updatedAt: Date.now() - 100,
      expiresAt: Date.now() - 50, // expired 50ms ago
    }

    await storeWithShortTtl.set('expired-key', record)
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 20))
    
    const result = await storeWithShortTtl.get('expired-key')
    expect(result).toBeNull()
    
    storeWithShortTtl.destroy()
  })

  it('deletes a record', async () => {
    const record: Omit<IdempotencyRecord, 'key'> = {
      status: 'succeeded',
      paymentIntentId: 'pi_123',
      amount: 1000,
      currency: 'usd',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + 10000,
    }

    await store.set('test-key', record)
    await store.delete('test-key')
    const result = await store.get('test-key')
    expect(result).toBeNull()
  })

  it('returns true for exists when record exists and not expired', async () => {
    const record: Omit<IdempotencyRecord, 'key'> = {
      status: 'succeeded',
      paymentIntentId: 'pi_123',
      amount: 1000,
      currency: 'usd',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + 10000,
    }

    await store.set('test-key', record)
    const exists = await store.exists('test-key')
    expect(exists).toBe(true)
  })

  it('returns false for exists when record does not exist', async () => {
    const exists = await store.exists('non-existent')
    expect(exists).toBe(false)
  })

  it('returns false for exists when record is expired', async () => {
    const storeWithShortTtl = new InMemoryIdempotencyStore({ defaultTtlMs: 10, cleanupIntervalMs: 5 })
    
    const record: Omit<IdempotencyRecord, 'key'> = {
      status: 'succeeded',
      paymentIntentId: 'pi_123',
      amount: 1000,
      currency: 'usd',
      createdAt: Date.now() - 100,
      updatedAt: Date.now() - 100,
      expiresAt: Date.now() - 50,
    }

    await storeWithShortTtl.set('expired-key', record)
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 20))
    
    const exists = await storeWithShortTtl.exists('expired-key')
    expect(exists).toBe(false)
    
    storeWithShortTtl.destroy()
  })

  it('cleans up expired records periodically', async () => {
    const storeWithShortTtl = new InMemoryIdempotencyStore({ defaultTtlMs: 10, cleanupIntervalMs: 5 })
    
    const record: Omit<IdempotencyRecord, 'key'> = {
      status: 'succeeded',
      paymentIntentId: 'pi_123',
      amount: 1000,
      currency: 'usd',
      createdAt: Date.now() - 100,
      updatedAt: Date.now() - 100,
      expiresAt: Date.now() - 50,
    }

    await storeWithShortTtl.set('expired-key', record)
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 20))
    
    // The record should be cleaned up
    const result = await storeWithShortTtl.get('expired-key')
    expect(result).toBeNull()
    
    storeWithShortTtl.destroy()
  })

  it('overwrites existing key on set', async () => {
    const record1: Omit<IdempotencyRecord, 'key'> = {
      status: 'succeeded',
      paymentIntentId: 'pi_123',
      amount: 1000,
      currency: 'usd',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + 10000,
    }

    const record2: Omit<IdempotencyRecord, 'key'> = {
      status: 'failed',
      paymentIntentId: 'pi_456',
      amount: 2000,
      currency: 'eur',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + 10000,
    }

    await store.set('test-key', record1)
    await store.set('test-key', record2)
    
    const result = await store.get('test-key')
    expect(result?.paymentIntentId).toBe('pi_456')
    expect(result?.status).toBe('failed')
  })
})