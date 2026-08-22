<script setup lang="ts">
import { ref } from "vue"

// --- Types ---
interface PaymentIntentResult {
  id: string
  status: "succeeded" | "failed" | "requires_action"
  client_secret?: string
  amount: number
  currency: string
}

interface AlertState {
  variant: "success" | "error" | "warning" | "info"
  title: string
  message: string
}

// --- Mock Stripe Adapter (same as HTML demo) ---
class DemoIdempotencyStore {
  private store = new Map<string, PaymentIntentResult>()

  async get(key: string): Promise<PaymentIntentResult | null> {
    return this.store.get(key) || null
  }

  async set(key: string, record: PaymentIntentResult): Promise<void> {
    this.store.set(key, { ...record, key })
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key)
  }
}

const demoStore = new DemoIdempotencyStore()

const mockStripe = {
  paymentIntents: {
    create: async (
      params: {
        amount: number
        currency: string
        payment_method: string
      },
      { idempotencyKey }: { idempotencyKey: string },
    ): Promise<PaymentIntentResult> => {
      await new Promise(r => setTimeout(r, 800))

      const existing = await demoStore.get(idempotencyKey)
      if (existing) return existing

      const { amount, payment_method: pm } = params
      let status: PaymentIntentResult["status"] = "succeeded"
      let client_secret: string | null = null

      if (pm.includes("fail")) status = "failed"
      else if (pm.includes("3ds") || pm.includes("action")) {
        status = "requires_action"
        client_secret = `pi_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`
      }

      const result: PaymentIntentResult = {
        id: `pi_${Date.now()}`,
        status,
        client_secret,
        amount,
        currency: params.currency,
      }

      await demoStore.set(idempotencyKey, result)
      return result
    },
  },
}

// --- i18n Strings (matching the React component) ---
const strings = {
  panel: {
    title: "Manual Charge",
    amountLabel: "Amount",
    amountHelper: "Enter amount in dollars (e.g., 150.00)",
    currencyLabel: "Currency",
    currencyPlaceholder: "Select currency",
    paymentMethodLabel: "Payment Method ID",
    paymentMethodPlaceholder: "pm_card_visa",
    paymentMethodHelper:
      "Use test PM: pm_card_visa, pm_card_visa_fail, pm_card_3ds",
    idempotencyKeyLabel: "Unique Key",
    idempotencyKeyPlaceholder: "booking-vcc:res_123:15000:usd",
    idempotencyKeyHelper: "Format: prefix:id:amount_cents:currency",
    chargeButton: "Charge",
    charging: "Processing...",
  },
  charge: {
    success: "Charge Successful",
    successMessage: "Payment {id} completed",
    failed: "Charge Failed",
    failedMessage: "Status: {status}",
    error: "Error",
    missingFields: "Payment Method and Unique Key are required",
    requiresAction: "Additional Authentication Required",
    requiresActionMessage: "3D Secure authentication needed",
  },
}

function t(key: string, params?: Record<string, string>): string {
  const keys = key.split(".")
  let value: unknown = strings
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k]
    } else return key
  }
  if (typeof value === "function") return (value as Function)(params)
  if (typeof value === "string") {
    if (params) return value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "")
    return value
  }
  return key
}

// --- Currency Options ---
const CURRENCY_OPTIONS = [
  { value: "usd", label: "USD ($)" },
  { value: "eur", label: "EUR (€)" },
  { value: "gbp", label: "GBP (£)" },
  { value: "crc", label: "CRC (₡)" },
] as const

// --- Reactive State ---
const amount = ref(150)
const currency = ref("usd")
const paymentMethodId = ref("")
const idempotencyKey = ref("")
const alert = ref<AlertState | null>(null)
const isLoading = ref(false)

// --- Actions ---
function dismissAlert() {
  alert.value = null
}

async function handleSubmit(e: Event) {
  e.preventDefault()
  if (!paymentMethodId.value.trim() || !idempotencyKey.value.trim()) {
    alert.value = {
      variant: "error",
      title: t("charge.error"),
      message: t("charge.missingFields"),
    }
    return
  }

  isLoading.value = true

  try {
    const amountCents = Math.round(amount.value * 100)
    const result = await mockStripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: currency.value.toLowerCase(),
        payment_method: paymentMethodId.value.trim(),
      },
      { idempotencyKey: idempotencyKey.value.trim() },
    )

    if (result.status === "succeeded") {
      alert.value = {
        variant: "success",
        title: t("charge.success"),
        message: t("charge.successMessage", { id: result.id }),
      }
    } else if (result.status === "requires_action") {
      alert.value = {
        variant: "warning",
        title: t("charge.requiresAction"),
        message: t("charge.requiresActionMessage"),
      }
    } else {
      alert.value = {
        variant: "error",
        title: t("charge.failed"),
        message: t("charge.failedMessage", { status: result.status }),
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    alert.value = { variant: "error", title: t("charge.error"), message }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="moto-pos-charge-panel">
    <div class="moto-pos-charge-header">
      <h2 class="moto-pos-charge-title">{{ t("panel.title") }}</h2>
    </div>

    <form @submit="handleSubmit" class="moto-pos-charge-form">
      <div class="moto-pos-charge-form-grid">
        <div class="form-group">
          <label for="amount">{{ t("panel.amountLabel") }}</label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            v-model.number="amount"
            placeholder="0.00"
            :disabled="isLoading"
          />
          <div class="helper">{{ t("panel.amountHelper") }}</div>
        </div>

        <div class="form-group">
          <label for="currency">{{ t("panel.currencyLabel") }}</label>
          <select
            id="currency"
            name="currency"
            v-model="currency"
            :disabled="isLoading"
          >
            <option value="" disabled>
              {{ t("panel.currencyPlaceholder") }}
            </option>
            <option
              v-for="opt in CURRENCY_OPTIONS"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="paymentMethodId">{{
            t("panel.paymentMethodLabel")
          }}</label>
          <input
            id="paymentMethodId"
            name="paymentMethodId"
            type="text"
            v-model="paymentMethodId"
            :placeholder="t('panel.paymentMethodPlaceholder')"
            :disabled="isLoading"
          />
          <div class="helper">{{ t("panel.paymentMethodHelper") }}</div>
        </div>

        <div class="form-group">
          <label for="idempotencyKey">{{
            t("panel.idempotencyKeyLabel")
          }}</label>
          <input
            id="idempotencyKey"
            name="idempotencyKey"
            type="text"
            v-model="idempotencyKey"
            :placeholder="t('panel.idempotencyKeyPlaceholder')"
            :disabled="isLoading"
          />
          <div class="helper">{{ t("panel.idempotencyKeyHelper") }}</div>
        </div>
      </div>

      <div
        v-if="alert"
        class="alert"
        :class="`alert-${alert.variant}`"
        style="
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          margin-top: 1rem;
          animation: slideIn 0.2s ease;
        "
      >
        <div>
          <div style="font-weight: 600; margin-bottom: 0.25rem">
            {{ alert.title }}
          </div>
          <div>{{ alert.message }}</div>
        </div>
        <button
          @click="dismissAlert"
          style="
            background: none;
            border: none;
            color: inherit;
            opacity: 0.6;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
            font-size: 1.25rem;
            line-height: 1;
          "
        >
          ×
        </button>
      </div>

      <div class="moto-pos-charge-actions">
        <button
          type="submit"
          class="btn btn-primary"
          :class="{ 'btn-loading': isLoading }"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="btn-spinner" aria-hidden="true"></span>
          {{ isLoading ? t("panel.charging") : t("panel.chargeButton") }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Scoped styles matching the design tokens from @moto-pos/core/tokens.css */
.moto-pos-charge-panel {
  background: var(--moto-pos-color-background, #fff);
  border-radius: var(--moto-pos-radius-lg, 12px);
  box-shadow: var(--moto-pos-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  padding: var(--moto-pos-space-6, 24px);
  font-family: var(--moto-pos-font-sans, system-ui, sans-serif);
}

.moto-pos-charge-header {
  margin-bottom: var(--moto-pos-space-4, 16px);
}

.moto-pos-charge-title {
  margin: 0;
  font-size: var(--moto-pos-text-xl, 1.25rem);
  font-weight: var(--moto-pos-font-semibold, 600);
  color: var(--moto-pos-color-text-primary, #18181b);
}

.moto-pos-charge-form-grid {
  display: grid;
  gap: var(--moto-pos-space-4, 16px);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--moto-pos-space-1, 4px);
}

.form-group label {
  font-size: var(--moto-pos-text-sm, 0.875rem);
  font-weight: var(--moto-pos-font-medium, 500);
  color: var(--moto-pos-color-text-primary, #18181b);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: var(--moto-pos-space-2, 8px) var(--moto-pos-space-3, 12px);
  font-size: var(--moto-pos-text-sm, 0.875rem);
  border: 1px solid var(--moto-pos-color-border, #e4e4e7);
  border-radius: var(--moto-pos-radius-sm, 6px);
  background: var(--moto-pos-color-surface, #fafafa);
  color: var(--moto-pos-color-text-primary, #18181b);
  transition:
    border-color var(--moto-pos-transition-fast, 150ms ease),
    box-shadow var(--moto-pos-transition-fast, 150ms ease);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--moto-pos-color-border-focus, #034b25);
  box-shadow: var(
    --moto-pos-shadow-focus,
    0 0 0 3px var(--moto-pos-color-primary-light, #e8f5ee)
  );
}

.form-group input:disabled {
  background: var(--moto-pos-color-surface-hover, #f4f4f5);
  color: var(--moto-pos-color-text-muted, #a1a1aa);
  cursor: not-allowed;
}

.helper {
  font-size: var(--moto-pos-text-xs, 0.75rem);
  color: var(--moto-pos-color-text-secondary, #52525b);
}

/* Alert */
.alert {
  margin-top: var(--moto-pos-space-4, 16px);
  animation: slideIn var(--moto-pos-transition-fast, 150ms ease);
}

.alert-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.alert-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Button */
.moto-pos-charge-actions {
  margin-top: var(--moto-pos-space-4, 16px);
}

.btn {
  width: 100%;
  padding: var(--moto-pos-space-3, 12px) var(--moto-pos-space-4, 16px);
  font-size: var(--moto-pos-text-sm, 0.875rem);
  font-weight: var(--moto-pos-font-semibold, 600);
  border-radius: var(--moto-pos-radius-sm, 6px);
  border: none;
  cursor: pointer;
  transition:
    background-color var(--moto-pos-transition-fast, 150ms ease),
    opacity var(--moto-pos-transition-fast, 150ms ease);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--moto-pos-space-2, 8px);
}

.btn-primary {
  background: var(--moto-pos-color-primary, #034b25);
  color: var(--moto-pos-color-text-inverse, #fff);
}

.btn-primary:hover:not(:disabled) {
  background: var(--moto-pos-color-primary-hover, #023a1d);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-loading {
  position: relative;
  color: transparent;
}

.btn-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
