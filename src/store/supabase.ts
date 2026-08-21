import { createClient, SupabaseClient } from "@supabase/supabase-js"
import type {
  IdempotencyStore,
  IdempotencyRecord,
  SupabaseIdempotencyStoreOptions,
} from "../types/index.js"

export type { SupabaseIdempotencyStoreOptions }

const DEFAULT_TABLE = "moto_pos_idempotency_keys"

export class SupabaseIdempotencyStore implements IdempotencyStore {
  private supabase: SupabaseClient
  private tableName: string
  private defaultTtlMs: number

  constructor(options: SupabaseIdempotencyStoreOptions) {
    this.supabase = createClient(options.url, options.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    this.tableName = options.tableName ?? DEFAULT_TABLE
    this.defaultTtlMs = options.defaultTtlMs ?? 24 * 60 * 60 * 1000
  }

  async initialize(): Promise<void> {
    const { error } = await this.supabase.rpc("create_idempotency_table", {
      table_name: this.tableName,
    })
    if (error && !error.message.includes("already exists")) {
      throw error
    }
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("key", key)
      .single()

    if (error || !data) return null
    if (Date.now() > data.expires_at) {
      await this.delete(key)
      return null
    }
    return this.mapRow(data)
  }

  async set(
    key: string,
    record: Omit<IdempotencyRecord, "key">,
  ): Promise<void> {
    const { error } = await this.supabase.from(this.tableName).upsert(
      {
        key,
        status: record.status,
        payment_intent_id: record.paymentIntentId ?? null,
        client_secret: record.clientSecret ?? null,
        amount: record.amount,
        currency: record.currency,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
        expires_at: record.expiresAt,
      },
      {
        onConflict: "key",
      },
    )
    if (error) throw error
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("key", key)
    if (error) throw error
  }

  async exists(key: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("key")
      .eq("key", key)
      .gt("expires_at", Date.now())
      .single()
    return !error && !!data
  }

  async cleanup(): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .lt("expires_at", Date.now())
    if (error) throw error
    return count ?? 0
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
