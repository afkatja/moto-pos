---
layout: doc
title: UI Preview - @moto-pos/core
description: Interactive preview of the MotoChargePanel component
---

# UI Preview

Interactive demo of the **MotoChargePanel** component — the standalone MOTO POS charge UI with idempotency, i18n, and theming built in.

<MotoChargePanel />

## Test Payment Methods

Use these Stripe test PaymentMethod IDs to simulate different outcomes:

| PaymentMethod ID    | Behavior                     |
| ------------------- | ---------------------------- |
| `pm_card_visa`      | ✅ Succeeds                  |
| `pm_card_visa_fail` | ❌ Fails                     |
| `pm_card_3ds`       | 🔐 Requires 3D Secure action |

## Unique Key Format

```
booking-vcc:res_123:15000:usd
```

Format: `prefix:id:amount_cents:currency` — prevents duplicate charges beyond Stripe's 24h window.

## Source Code

The demo uses the same component you'd import in your app:

```tsx
import { MotoChargePanel } from "@moto-pos/core/react"
import "@moto-pos/core/tokens.css"
return <MotoChargePanel defaultAmount={15000} defaultCurrency="usd" />
```
