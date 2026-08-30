import { useMemo } from "react"
import {
  StatusAlert,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./primitives/index.ts"
import { useStrings } from "@moto-pos/core/strings"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import MotoChargePanelInner from "./MotoChargePanelForm.tsx"
import "../tokens/tokens.css"
import "./MotoChargePanel.css"

export interface MotoChargePanelProps {
  defaultAmount?: number
  defaultCurrency?: string
  idempotencyPrefix?: string
  publishableKey: string
  endpoint?: string
  getAuthToken?: () => string | null
  onSuccess?: (result: { paymentIntentId: string; status: string }) => void
  onError?: (error: Error) => void
  onRequiresAction?: (clientSecret: string, paymentIntentId: string) => void
  className?: string
  disabled?: boolean
}

export function MotoChargePanel({
  defaultAmount = 100,
  defaultCurrency = "usd",
  idempotencyPrefix = "booking-vcc",
  publishableKey,
  endpoint,
  getAuthToken,
  onSuccess,
  onError,
  onRequiresAction,
  className = "",
  disabled = false,
}: MotoChargePanelProps) {
  const { t } = useStrings()

  const stripePromise = useMemo(
    () => loadStripe(publishableKey),
    [publishableKey],
  )

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

  return (
    <Elements
      stripe={stripePromise}
      key={`moto-pos-${publishableKey.slice(0, 20)}`}
    >
      <MotoChargePanelInner
        defaultAmount={defaultAmount}
        defaultCurrency={defaultCurrency}
        idempotencyPrefix={idempotencyPrefix}
        endpoint={endpoint}
        getAuthToken={getAuthToken}
        onSuccess={onSuccess}
        onError={onError}
        onRequiresAction={onRequiresAction}
        className={className}
        disabled={disabled}
      />
    </Elements>
  )
}
