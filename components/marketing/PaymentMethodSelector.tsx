"use client"

import { CreditCard, Check } from "lucide-react"

export type PaymentMethod = "stripe" | "paypal"

interface Props {
  value: PaymentMethod
  onChange: (m: PaymentMethod) => void
  theme?: "light" | "dark"
  labels: { card: string; paypal: string; legend: string }
  disabled?: boolean
}

/**
 * Card-vs-PayPal chooser for checkout. Rendered ONLY when the PayPal gateway is
 * configured server-side (see PricingButtons `paypalAvailable`) — with no PayPal
 * credentials the whole control is absent and checkout stays Stripe-only.
 *
 * Radiogroup semantics (not two buttons): arrow keys move between options and
 * screen readers announce "1 of 2 selected", which a pair of buttons cannot do.
 */
export default function PaymentMethodSelector({ value, onChange, theme = "light", labels, disabled }: Props) {
  const dark = theme === "dark"
  const options: Array<{ id: PaymentMethod; label: string; icon: React.ReactNode }> = [
    { id: "stripe", label: labels.card, icon: <CreditCard className="h-4 w-4" aria-hidden /> },
    { id: "paypal", label: labels.paypal, icon: <PayPalMark /> },
  ]

  return (
    <fieldset disabled={disabled} className="min-w-0 disabled:opacity-60">
      <legend className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${dark ? "text-white/55" : "text-[#1a2e4a]/55"}`}>
        {labels.legend}
      </legend>
      <div role="radiogroup" aria-label={labels.legend} className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const selected = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.id)}
              className={[
                // 44px min height keeps the touch target compliant.
                "group relative flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 py-2.5",
                "text-xs font-bold transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] focus-visible:ring-offset-2",
                dark ? "focus-visible:ring-offset-[#0f1a2e]" : "focus-visible:ring-offset-white",
                selected
                  ? "border-[#00D4FF]/60 bg-gradient-to-br from-[#00D4FF]/12 to-[#4F8BFF]/8 text-[#1a2e4a] shadow-[0_6px_18px_-8px_rgba(0,212,255,0.55)]"
                  : dark
                    ? "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/25 hover:bg-white/[0.07]"
                    : "border-[#1a2e4a]/12 bg-white text-[#1a2e4a]/65 hover:border-[#1a2e4a]/25 hover:bg-[#1a2e4a]/[0.03]",
                selected && dark ? "text-white" : "",
              ].join(" ")}
            >
              {opt.icon}
              <span className="truncate">{opt.label}</span>
              {/* Selection is marked by a check too, never by color alone. */}
              {selected && (
                <Check className="absolute right-2 top-2 h-3 w-3 text-[#00D4FF]" aria-hidden />
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Inline PayPal wordmark glyph — avoids an external brand asset request. */
function PayPalMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden focusable="false">
      <path d="M7.08 21.34a.64.64 0 0 1-.63-.74l2.4-15.2a.9.9 0 0 1 .88-.75h5.06c2.9 0 4.75 1.5 4.32 4.32-.44 2.9-2.62 4.5-5.58 4.5h-2.2a.9.9 0 0 0-.88.76l-.72 4.55a.9.9 0 0 1-.88.76H7.08Z" />
      <path opacity=".55" d="M4.6 19.2a.55.55 0 0 1-.54-.64l2.07-13.1A.78.78 0 0 1 6.9 4.8h4.36c2.5 0 4.1 1.3 3.73 3.73-.38 2.5-2.26 3.88-4.81 3.88H8.29a.78.78 0 0 0-.77.65l-.62 3.93a.78.78 0 0 1-.76.65H4.6Z" />
    </svg>
  )
}
