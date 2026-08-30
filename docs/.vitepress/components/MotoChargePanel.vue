<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue"
import { createRoot } from "react-dom/client"

interface Props {
  defaultAmount?: number
  defaultCurrency?: string
  idempotencyPrefix?: string
  publishableKey: string
  onSuccess?: (result: { paymentIntentId: string; status: string }) => void
  onError?: (error: Error) => void
  onRequiresAction?: (clientSecret: string, paymentIntentId: string) => void
  className?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultAmount: 100,
  defaultCurrency: "usd",
  idempotencyPrefix: "booking-vcc",
  className: "",
  disabled: false,
})

const containerRef = ref<HTMLDivElement>()
let reactRoot: ReturnType<typeof createRoot> | null = null
let originalFetch: typeof window.fetch | null = null

// Check if publishable key is valid (not placeholder)
const isValidKey = computed(
  () =>
    props.publishableKey &&
    (props.publishableKey.startsWith("pk_test_") ||
      props.publishableKey.startsWith("pk_live_")) &&
    props.publishableKey !== "pk_test_placeholder",
)

// --- Mock Stripe Backend (simulates server-side Stripe handling) ---
interface PaymentIntentResult {
  id: string
  status: "succeeded" | "failed" | "requires_action"
  client_secret?: string
  amount: number
  currency: string
}

interface IdempotencyRecord {
  key: string
  status: "succeeded" | "failed" | "requires_action"
  paymentIntentId: string
  clientSecret?: string
  amount: number
  currency: string
  createdAt: number
  updatedAt: number
  expiresAt: number
}

class DemoIdempotencyStore {
  private store = new Map<string, IdempotencyRecord>()

  async get(key: string): Promise<IdempotencyRecord | null> {
    const record = this.store.get(key)
    if (!record) return null
    // Check expiration
    if (Date.now() > record.expiresAt) {
      this.store.delete(key)
      return null
    }
    return record
  }

  async set(key: string, record: IdempotencyRecord): Promise<void> {
    this.store.set(key, { ...record, key })
  }
}

const demoStore = new DemoIdempotencyStore()

// Render React component
async function renderReactComponent() {
  if (!containerRef.value) return

  const [
    { createRoot },
    ReactModule,
    { QueryClient, QueryClientProvider },
    MotoPosModule,
  ] = await Promise.all([
    import("react-dom/client"),
    import("react"),
    import("@tanstack/react-query"),
    import("@moto-pos/core/react"),
  ])

  // Create a QueryClient for TanStack Query
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const React = ReactModule.default
  if (!reactRoot) {
    reactRoot = createRoot(containerRef.value)
  }

  // Use valid key or show placeholder message in component
  const publishableKey = isValidKey.value
    ? props.publishableKey
    : "pk_test_placeholder"

  const { MotoChargePanel } = MotoPosModule
  reactRoot.render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MotoChargePanel, {
        defaultAmount: props.defaultAmount,
        defaultCurrency: props.defaultCurrency,
        idempotencyPrefix: props.idempotencyPrefix,
        publishableKey,
        onSuccess: props.onSuccess,
        onError: props.onError,
        onRequiresAction: props.onRequiresAction,
        className: props.className,
        disabled: props.disabled,
      }),
    ),
  )
}

// Mock Stripe payment intent creation based on test card numbers
// Note: In real Stripe, the paymentMethodId (pm_...) is created from card details.
// For demo purposes, we use a simple heuristic based on the paymentMethodId suffix.
async function mockCreatePaymentIntent(
  params: { amount: number; currency: string; payment_method: string },
  { idempotencyKey }: { idempotencyKey: string },
): Promise<PaymentIntentResult> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 800))

  // Check idempotency
  const existing = await demoStore.get(idempotencyKey)
  if (existing) {
    return {
      id: existing.paymentIntentId,
      status: existing.status,
      client_secret: existing.clientSecret,
      amount: existing.amount,
      currency: existing.currency,
    }
  }

  const { amount, payment_method: pm } = params
  let status: PaymentIntentResult["status"] = "succeeded"
  let client_secret: string | null = null

  // Test card behavior based on paymentMethodId suffix (demo heuristic)
  // Real Stripe test cards: 4242 4242 4242 4242 = success
  // 4000 0000 0000 0002 = declined (card_declined)
  // 4000 0000 0000 3220 = 3D Secure required
  // For demo: use pm_ ID suffix as proxy
  if (pm.endsWith("0002") || pm.includes("declined") || pm.includes("fail")) {
    status = "failed"
  } else if (
    pm.endsWith("3220") ||
    pm.includes("3ds") ||
    pm.includes("action")
  ) {
    status = "requires_action"
    client_secret = `pi_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`
  }

  const result: PaymentIntentResult = {
    id: `pi_${Date.now()}`,
    status,
    client_secret: client_secret ?? undefined,
    amount,
    currency: params.currency,
  }

  // Store for idempotency
  const record: IdempotencyRecord = {
    key: idempotencyKey,
    status,
    paymentIntentId: result.id,
    clientSecret: result.client_secret,
    amount,
    currency: params.currency,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  }
  await demoStore.set(idempotencyKey, record)

  return result
}

// Intercept fetch to /api/pos/charge and handle with mock (client-side only)
onMounted(() => {
  if (typeof window !== "undefined") {
    originalFetch = window.fetch
    window.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString()
      if (url.includes("/api/pos/charge") && init?.method === "POST") {
        console.log("[Mock API] Intercepted charge request")
        try {
          const body = JSON.parse(init.body as string)
          console.log("[Mock API] Request body:", body)

          const result = await mockCreatePaymentIntent(
            {
              amount: body.amount,
              currency: body.currency,
              payment_method: body.paymentMethodId,
            },
            { idempotencyKey: body.idempotencyKey },
          )

          console.log("[Mock API] Response:", result)

          if (result.status === "succeeded") {
            return new Response(
              JSON.stringify({
                paymentIntentId: result.id,
                status: "succeeded",
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            )
          }

          if (result.status === "requires_action") {
            return new Response(
              JSON.stringify({
                error: "Payment requires additional authentication (3D Secure)",
                status: "requires_action",
                clientSecret: result.client_secret,
                paymentIntentId: result.id,
              }),
              { status: 422, headers: { "Content-Type": "application/json" } },
            )
          }

          return new Response(
            JSON.stringify({
              error: `Stripe payment status: ${result.status}`,
              status: "failed",
              paymentIntentId: result.id,
            }),
            { status: 422, headers: { "Content-Type": "application/json" } },
          )
        } catch (err) {
          console.error("[Mock API] Error:", err)
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          )
        }
      }
      return originalFetch!.apply(window, [input, init] as Parameters<
        typeof window.fetch
      >)
    }
  }
  renderReactComponent()
})

onUnmounted(() => {
  // Restore original fetch
  if (typeof window !== "undefined" && originalFetch) {
    window.fetch = originalFetch
  }
  if (reactRoot) {
    reactRoot.unmount()
    reactRoot = null
  }
})
</script>

<template>
  <div class="moto-pos-charge-panel-wrapper">
    <div v-if="!isValidKey" class="demo-key-warning">
      <strong>Demo Mode:</strong> Enter a valid Stripe publishable key (starting
      with <code>pk_test_</code> or <code>pk_live_</code>) to test the
      CardElement. Get test keys from
      <a href="https://dashboard.stripe.com/test/apikeys" target="_blank"
        >Stripe Dashboard</a
      >.
    </div>
    <div ref="containerRef" />
    <div class="demo-info">
      <h4>Test Card Numbers:</h4>
      <ul>
        <li><code>4242 4242 4242 4242</code> → ✅ Succeeds</li>
        <li><code>4000 0000 0000 0002</code> → ❌ Declined</li>
        <li><code>4000 0000 0000 3220</code> → 🔐 Requires 3D Secure</li>
      </ul>
      <p>
        <em
          >Enter any future expiry date and any 3-digit CVC. The mock backend
          simulates Stripe MOTO payment processing.</em
        >
      </p>
    </div>
  </div>
</template>

<style scoped>
.moto-pos-charge-panel-wrapper {
  min-height: 400px;
}
.demo-key-warning {
  padding: 1rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  color: #92400e;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}
.demo-key-warning a {
  color: #034b25;
  text-decoration: underline;
}
.demo-key-warning code {
  background: #f4f4f5;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: monospace;
}
.demo-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
}
.demo-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #374151;
}
.demo-info ul {
  margin: 0 0 0.5rem 0;
  padding-left: 1.25rem;
}
.demo-info li {
  margin-bottom: 0.25rem;
}
.demo-info code {
  background: #e2e8f0;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8125rem;
}
.demo-info p {
  margin: 0;
  color: #64748b;
  font-style: italic;
}
</style>
