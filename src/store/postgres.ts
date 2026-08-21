import { Pool, PoolConfig } from "pg"
import type {
  IdempotencyStore,
  IdempotencyRecord,
  PostgresIdempotencyStoreOptions,
} from "../types/index.js"

export type { PostgresIdempotencyStoreOptions }

const DEFAULT_TABLE = "moto_pos_idempotency_keys"

export class PostgresIdempotencyStore implements IdempotencyStore {
  private pool: Pool
  private tableName: string
  private defaultTtlMs: number

  constructor(options: PostgresIdempotencyStoreOptions) {
    const poolConfig: PoolConfig = options.connectionString
      ? { connectionString: options.connectionString }
      : {}
    this.pool = new Pool(poolConfig)
    this.tableName = options.tableName ?? DEFAULT_TABLE
    this.defaultTtlMs = options.defaultTtlMs ?? 24 * 60 * 60 * 1000
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        key VARCHAR(255) PRIMARY KEY,
        status VARCHAR(50) NOT NULL,
        payment_intent_id VARCHAR(255),
        client_secret TEXT,
        amount BIGINT NOT NULL,
        currency VARCHAR(10) NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expires_at ON ${this.tableName} (expires_at);
    `)
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE key = $1`,
      [key],
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    if (Date.now() > row.expires_at) {
      await this.delete(key)
      return null
    }
    return this.mapRow(row)
  }

  async set(
    key: string,
    record: Omit<IdempotencyRecord, "key">,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO ${this.tableName} (key, status, payment_intent_id, client_secret, amount, currency, created_at, updated_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (key) DO UPDATE SET
         status = EXCLUDED.status,
         payment_intent_id = EXCLUDED.payment_intent_id,
         client_secret = EXCLUDED.client_secret,
         amount = EXCLUDED.amount,
         currency = EXCLUDED.currency,
         updated_at = EXCLUDED.updated_at,
         expires_at = EXCLUDED.expires_at`,
      [
        key,
        record.status,
        record.paymentIntentId ?? null,
        record.clientSecret ?? null,
        record.amount,
        record.currency,
        record.createdAt,
        record.updatedAt,
        record.expiresAt,
      ],
    )
  }

  async delete(key: string): Promise<void> {
    await this.pool.query(`DELETE FROM ${this.tableName} WHERE key = $1`, [key])
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM ${this.tableName} WHERE key = $1 AND expires_at > $2`,
      [key, Date.now()],
    )
    return result.rows.length > 0
  }

  async cleanup(): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE expires_at < $1`,
      [Date.now()],
    )
    return result.rowCount ?? 0
  }

  async close(): Promise<void> {
    await this.pool.end()
  }

  private mapRow(row: any): IdempotencyRecord {
    return {
      key: row.key,
      status: row.status,
      paymentIntentId: row.payment_intent_id,
      clientSecret: row.client_secret,
      amount: Number(row.amount),
      currency: row.currency,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
      expiresAt: Number(row.expires_at),
    }
  }
}
