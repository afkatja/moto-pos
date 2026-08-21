import type {
  ChargeInput,
  ChargeResult,
  ModuleConfig,
  StripeClient,
  IdempotencyRecord,
  IdempotencyStore,
} from "../types/index.js"
import { validateChargeInput } from "./validation.ts"

const mapStatus = (
  stripeStatus: string,
): "succeeded" | "requires_action" | "failed" | "pending" => {
  switch (stripeStatus) {
    case "succeeded":
      return "succeeded"
    case "requires_action":
      return "requires_action"
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_capture":
    case "processing":
      return "pending"
    case "canceled":
      return "failed"
    default:
      return "failed"
  }
}

export async function createCharge(
  input: ChargeInput,
  stripe: StripeClient,
  config: ModuleConfig,
  idempotencyStore?: IdempotencyStore,
): Promise<ChargeResult> {
  const errors = validateChargeInput(input, config)
  if (errors.length > 0) {
    const error = new Error("Validation failed") as Error & {
      validationErrors: typeof errors
    }
    error.validationErrors = errors
    throw error
  }

  const {
    amount,
    currency,
    paymentMethodId,
    idempotencyKey,
    description,
    metadata,
  } = input

  if (idempotencyStore) {
    const existing = await idempotencyStore.get(idempotencyKey)
    if (existing) {
      if (existing.status === "succeeded") {
        return {
          paymentIntentId: existing.paymentIntentId!,
          status: "succeeded",
        }
      }
      if (existing.status === "requires_action") {
        return {
          paymentIntentId: existing.paymentIntentId!,
          status: "requires_action",
          clientSecret: existing.clientSecret,
        }
      }
      if (existing.status === "failed") {
        return { paymentIntentId: existing.paymentIntentId!, status: "failed" }
      }
    }
  }

  const intent = await stripe.paymentIntents.create(
    {
      amount,
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      payment_method_types: ["card"],
      payment_method_options: {
        card: {
          moto: true,
        },
      },
      description,
      metadata,
    },
    { idempotencyKey },
  )

  const now = Date.now()
  const mappedStatus = mapStatus(intent.status)

  const record: IdempotencyRecord = {
    key: idempotencyKey,
    status: mappedStatus,
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret ?? undefined,
    amount,
    currency: currency.toLowerCase(),
    createdAt: now,
    updatedAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000,
  }

  if (idempotencyStore) {
    await idempotencyStore.set(idempotencyKey, record)
  }

  const finalStatus = mappedStatus === "pending" ? "failed" : mappedStatus
  const result: ChargeResult = {
    paymentIntentId: intent.id,
    status: finalStatus as "succeeded" | "requires_action" | "failed",
  }
  if (finalStatus === "requires_action" && intent.client_secret) {
    result.clientSecret = intent.client_secret
  }
  return result
}
