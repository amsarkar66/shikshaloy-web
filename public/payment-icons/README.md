# Payment method logos

Drop an SVG here named `{key}.svg` to upgrade a payment method's icon from the generic
Lucide fallback to a real brand logo. No code changes needed — `PaymentMethodIcon`
(`app/dashboard/billing/_components/PaymentMethodIcon.tsx`) checks for a file at
`/payment-icons/{key}.svg` first and falls back automatically if it's missing.

## Key format

- Card networks: `card-{network}` — e.g. `card-visa.svg`, `card-mastercard.svg`, `card-rupay.svg`, `card-amex.svg`, `card-dinersclub.svg`
- Wallets: `wallet-{name}` — e.g. `wallet-paytm.svg`, `wallet-phonepe.svg`, `wallet-airtelmoney.svg`, `wallet-mobikwik.svg`, `wallet-freecharge.svg`, `wallet-olamoney.svg`, `wallet-amazonpay.svg`
- Netbanking: `netbanking-{bank code}` — e.g. `netbanking-hdfc.svg`, `netbanking-sbi.svg`, `netbanking-icic.svg`, `netbanking-utib.svg`
- UPI: `upi.svg` (single generic icon — Razorpay doesn't expose which UPI app was used)

The exact key for any given payment is `{razorpay_method}-{razorpay_method_detail}`
(both lowercased, non-alphanumeric characters stripped), computed by
`resolveMethodLogoKey` in `app/dashboard/billing/_data/billing.ts`. Check that
invoice's `razorpay_method_detail` column if you're unsure what a specific
bank/wallet/network normalized to.
