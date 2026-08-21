import { createClient, RedisClientType } from "redis"
import type {
  IdempotencyStore,
  IdempotencyRecord,
  RedisIdempotencyStoreOptions,
} from "../types/index.js"

export type { RedisIdempotencyStoreOptions }

export class RedisIdempotencyStore implements IdempotencyStore {
  private client: RedisClientType
  private keyPrefix: string
  private defaultTtlMs: number

  constructor(options: RedisIdempotencyStoreOptions) {
    this.client = createClient({ url: options.url }) as RedisClientType
    this.keyPrefix = options.keyPrefix ?? "moto-pos:idempotency:"
    this.defaultTtlMs = options.defaultTtlMs ?? 24 * 60 * 60 * 1000
  }

  async connect(): Promise<void> {
    await this.client.connect()
  }

  async disconnect(): Promise<void> {
    await this.client.quit()
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    const data = await this.client.get(this.getKey(key))
    if (!data) return null
    const record = JSON.parse(data) as IdempotencyRecord
    if (Date.now() > record.expiresAt) {
      await this.delete(key)
      return null
    }
    return record
  }

  async set(
    key: string,
    record: Omit<IdempotencyRecord, "key">,
  ): Promise<void> {
    const ttlSeconds = Math.ceil((record.expiresAt - Date.now()) / 1000)
    if (ttlSeconds <= 0) return
    await this.client.setEx(
      this.getKey(key),
      ttlSeconds,
      JSON.stringify({ ...record, key }),
    )
  }

  async delete(key: string): Promise<void> {
    await this.client.del(this.getKey(key))
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(this.getKey(key))) === 1
  }
}
