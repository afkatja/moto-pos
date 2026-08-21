import type {
  IdempotencyStore,
  IdempotencyRecord,
  InMemoryIdempotencyStoreOptions,
} from "../types/index.js"

export type { InMemoryIdempotencyStoreOptions }

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private store = new Map<string, IdempotencyRecord>()
  private defaultTtlMs: number
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(options: InMemoryIdempotencyStoreOptions = {}) {
    this.defaultTtlMs = options.defaultTtlMs ?? 24 * 60 * 60 * 1000
    if (options.cleanupIntervalMs) {
      this.cleanupInterval = setInterval(
        () => this.cleanup(),
        options.cleanupIntervalMs,
      )
    }
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    const record = this.store.get(key)
    if (!record) return null
    if (Date.now() > record.expiresAt) {
      this.store.delete(key)
      return null
    }
    return record
  }

  async set(
    key: string,
    record: Omit<IdempotencyRecord, "key">,
  ): Promise<void> {
    this.store.set(key, { ...record, key })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    const record = await this.get(key)
    return record !== null
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}
