import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { useCallback, useEffect, useState } from "react"
import { useCharge } from "./hooks/useCharge.ts"
import { Card, CardContent, CardHeader, CardTitle } from "./primitives/Card.tsx"
import { Button } from "./primitives/Button.tsx"
import { StatusAlert } from "./primitives/StatusAlert.tsx"
import { Select } from "./primitives/Select.tsx"
import { Input } from "./primitives/Input.tsx"
import { useStrings } from "./index.ts"

export interface MotoChargePanelProps {
  defaultAmount?: number
  defaultCurrency?: string
  idempotencyPrefix?: string
  onSuccess?: (result: { paymentIntentId: string; status: string }) => void
  onError?: (error: Error) => void
  onRequiresAction?: (clientSecret: string, paymentIntentId: string) => void
  className?: string
  disabled?: boolean
}

/**
 * MotoChargePanel accepts amounts in the major currency unit (e.g., USD with decimals like 10.99).
 * The component internally converts to minor units (cents) for the Stripe API.
 */

const CURRENCY_OPTIONS = [
  { value: "usd", label: "USD ($)" },
  { value: "eur", label: "EUR (€)" },
  { value: "gbp", label: "GBP (£)" },
  { value: "crc", label: "CRC (₡)" },
]

const MotoChargePanelInner = ({
  defaultAmount,
  defaultCurrency,
  idempotencyPrefix,
  onSuccess,
  onError,
  onRequiresAction,
  className,
  disabled,
}: MotoChargePanelProps) => {
  const normalizedDefaultAmount = Number(defaultAmount) || 0

  const stripe = useStripe()
  const elements = useElements()

  const [stripeReady, setStripeReady] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)
  const [amount, setAmount] = useState(normalizedDefaultAmount)
  const [currency, setCurrency] = useState(defaultCurrency)
  const [alert, setAlert] = useState<{
    variant: "success" | "error" | "warning" | "info"
    title: string
    message: string
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCardElementReady, setIsCardElementReady] = useState(false)

  const { t } = useStrings()

  // Track when Stripe is fully ready
  useEffect(() => {
    if (stripe) {
      setStripeReady(true)
    }
  }, [stripe])

  // Sync amountInputValue when defaultAmount prop changes
  // useEffect(() => {
  //   setAmountInputValue((Number(defaultAmount) || 0).toFixed(2))
  // }, [defaultAmount])

  const chargeMutation = useCharge({
    onSuccess: (result: {
      paymentIntentId: string
      status: string
      clientSecret?: string
    }) => {
      if (result.status === "succeeded") {
        setAlert({
          variant: "success",
          title: t("charge.success"),
          message: t("charge.successMessage", { id: result.paymentIntentId }),
        })
        onSuccess?.(result)
      } else if (result.status === "requires_action") {
        setAlert({
          variant: "warning",
          title: t("charge.requiresAction"),
          message: t("charge.requiresActionMessage"),
        })
        onRequiresAction?.(result.clientSecret!, result.paymentIntentId)
      } else {
        setAlert({
          variant: "error",
          title: t("charge.failed"),
          message: t("charge.failedMessage", { status: result.status }),
        })
      }
    },
    onError: (
      error: Error & {
        status?: number
        details?: Array<{ field: string; message: string }>
      },
    ) => {
      let message = error.message
      if (error.details && error.details.length > 0) {
        message = error.details.map(d => `${d.field}: ${d.message}`).join(", ")
      }
      setAlert({ variant: "error", title: t("charge.error"), message })
      onError?.(error)
    },
  })

  const canSubmit =
    isCardElementReady &&
    cardComplete &&
    stripeReady &&
    !isProcessing &&
    !chargeMutation.isPending

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (!stripe || !elements) {
        setAlert({
          variant: "error",
          title: t("charge.error"),
          message: t("charge.stripeNotLoaded"),
        })
        return
      }

      const cardElement = elements.getElement(CardElement)

      if (!stripeReady) {
        setAlert({
          variant: "error",
          title: t("charge.error"),
          message: "Stripe not ready. Please wait and try again.",
        })
        return
      }

      if (!isCardElementReady) {
        setAlert({
          variant: "error",
          title: t("charge.error"),
          message: t("charge.cardElementNotReady"),
        })
        return
      }

      if (!cardComplete) {
        setAlert({
          variant: "error",
          title: t("charge.error"),
          message:
            "Card details incomplete. Please fill in all required fields.",
        })
        return
      }

      if (!cardElement) {
        setAlert({
          variant: "error",
          title: t("charge.error"),
          message: t("charge.cardElementMissing"),
        })
        return
      }

      setIsProcessing(true)

      try {
        const { error: pmError, paymentMethod } =
          await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
          })

        if (pmError) {
          setAlert({
            variant: "error",
            title: t("charge.error"),
            message: pmError.message || t("charge.failed"),
          })
          setIsProcessing(false)
          return
        }

        const amountCents = Math.round(amount * 100)
        const generatedIdempotencyKey = `${idempotencyPrefix}:${crypto.randomUUID()}`

        chargeMutation.mutate({
          amount: amountCents,
          currency: currency || defaultCurrency || "usd",
          paymentMethodId: paymentMethod!.id,
          idempotencyKey: generatedIdempotencyKey,
        })
        setIsProcessing(false)
      } catch (err) {
        setAlert({
          variant: "error",
          title: t("charge.error"),
          message:
            err instanceof Error
              ? err.message
              : "Failed to create payment method",
        })
        setIsProcessing(false)
      }
    },
    [
      amount,
      currency,
      chargeMutation,
      elements,
      idempotencyPrefix,
      onRequiresAction,
      stripe,
      t,
      isCardElementReady,
      cardComplete,
      stripeReady,
    ],
  )

  const dismissAlert = useCallback(() => {
    setAlert(null)
  }, [])

  return (
    <Card
      variant="default"
      padding="md"
      className={`moto-pos-charge-panel ${className}`}
    >
      <CardHeader>
        <CardTitle>{t("panel.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="moto-pos-charge-form">
          <div className="moto-pos-charge-form-grid">
            <Input
              label={t("panel.amountLabel")}
              type="number"
              step="0.01"
              min="0"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                // setAmountInputValue(e.target.value)
                setAmount(parseFloat(e.target.value) || 0)
              }
              value={amount}
              placeholder="0.00"
              helperText={t("panel.amountHelper")}
              disabled={disabled || chargeMutation.isPending || isProcessing}
            />

            <Select
              label={t("panel.currencyLabel")}
              value={currency}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCurrency(e.target.value)
              }
              options={CURRENCY_OPTIONS}
              placeholder={t("panel.currencyPlaceholder")}
              disabled={disabled || chargeMutation.isPending || isProcessing}
            />
          </div>

          <div className="moto-pos-payment-element">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#32325d",
                    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                    fontSmoothing: "antialiased",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#fa755a",
                    iconColor: "#fa755a",
                  },
                },
              }}
              onReady={() => setIsCardElementReady(true)}
              onChange={event => setCardComplete(event.complete)}
            />
          </div>

          {alert && (
            <StatusAlert
              variant={alert.variant}
              title={alert.title}
              message={alert.message}
              dismissible
              onDismiss={dismissAlert}
              className="moto-pos-charge-alert"
            />
          )}

          <div className="moto-pos-charge-actions">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={chargeMutation.isPending || isProcessing}
              disabled={disabled || !canSubmit}
            >
              {!isCardElementReady || !stripeReady
                ? t("panel.loadingCardElement")
                : isProcessing
                  ? t("panel.processing")
                  : chargeMutation.isPending
                    ? t("panel.charging")
                    : t("panel.chargeButton")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
export default MotoChargePanelInner
