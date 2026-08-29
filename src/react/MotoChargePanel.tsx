import React, { useState, useCallback, useMemo } from "react"
import { useCharge } from "./hooks/useCharge.ts"
import {
  Input,
  Select,
  Button,
  StatusAlert,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./primitives/index.ts"
import { useStrings } from "@moto-pos/core/strings"
import { CardElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import "./MotoChargePanel.css"

export interface MotoChargePanelProps {
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

const CURRENCY_OPTIONS = [
  { value: "usd", label: "USD ($)" },
  { value: "eur", label: "EUR (€)" },
  { value: "gbp", label: "GBP (£)" },
  { value: "crc", label: "CRC (₡)" },
]

export function MotoChargePanel({
  defaultAmount = 0,
  defaultCurrency = "usd",
  idempotencyPrefix = "booking-vcc",
  publishableKey,
  onSuccess,
  onError,
  onRequiresAction,
  className = "",
  disabled = false,
}: MotoChargePanelProps) {
  const { t } = useStrings()
  const [amount, setAmount] = useState(defaultAmount)
  const [currency, setCurrency] = useState(defaultCurrency)
  const [alert, setAlert] = useState<{
    variant: "success" | "error" | "warning" | "info"
    title: string
    message: string
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey])

  if (!stripePromise) {
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
          <StatusAlert
            variant="error"
            title={t("charge.error")}
            message={t("charge.stripeNotLoaded")}
            className="moto-pos-charge-alert"
          />
        </CardContent>
      </Card>
    )
  }

  const MotoChargePanelInner = () => {
    const stripe = useStripe()
    const elements = useElements()

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
        if (!cardElement) {
          setAlert({
            variant: "error",
            title: t("charge.error"),
            message: t("charge.cardElementMissing"),
          })
          return
        }

        setIsProcessing(true)

        const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
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
          currency,
          paymentMethodId: paymentMethod!.id,
          idempotencyKey: generatedIdempotencyKey,
        })

        setIsProcessing(false)
      },
      [amount, currency, chargeMutation, elements, idempotencyPrefix, onRequiresAction, stripe, t],
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
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAmount(parseFloat(e.target.value) || 0)
                }
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
                disabled={disabled}
              >
                {isProcessing
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

  return (
    <Elements stripe={stripePromise} key={`moto-pos-${publishableKey.slice(0, 20)}`}>
      <MotoChargePanelInner />
    </Elements>
  )
}
