"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Copy, Check, Mail, Share2 } from "lucide-react"

interface Props {
  referralLink: string
  referralCode: string
  onCopy: () => void
  onCopyError: () => void
}

export default function ReferralHero({ referralLink, referralCode, onCopy, onCopyError }: Props) {
  const t = useTranslations("dashboard.referrals")
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      onCopy()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      onCopyError()
    }
  }

  const shareText = t("link.share_text")
  const emailSubject = t("link.email_subject")
  const emailBody = `${shareText}\n\n${referralLink}`

  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + referralLink)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
    email: `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`,
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[rgba(0,212,255,0.18)] p-5 sm:p-7"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #1a2e4a 0%, #142841 55%, #0e1d33 100%)",
      }}
    >
      {/* Decorative top accent + corner glow */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent" />
      <span className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(0,212,255,0.18),transparent)]" />
      <span className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(0,212,255,0.10),transparent)]" />

      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] uppercase text-[#00D4FF]/90 mb-3">
          <Share2 className="h-3 w-3" />
          {t("link.eyebrow")}
        </div>
        <h2
          className="text-white text-[20px] sm:text-[24px] font-bold tracking-tight leading-tight"
          style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
        >
          {t("link.title")}
        </h2>
        <p className="text-white/65 text-[13px] mt-1.5 max-w-[520px]">
          {t("link.subtitle")}
        </p>

        {/* Link input + copy */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 min-w-0 flex items-center rounded-xl border border-[rgba(0,212,255,0.28)] bg-[rgba(255,255,255,0.04)] backdrop-blur px-3.5 py-2.5">
            <code
              className="block w-full truncate text-[12.5px] sm:text-[13px] text-white/90 select-all"
              style={{ fontFamily: "var(--dash-mono,ui-monospace,Menlo,monospace)" }}
              title={referralLink}
            >
              {referralLink || `…/register?ref=${referralCode}`}
            </code>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="group relative inline-flex items-center justify-center gap-2 shrink-0 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold text-[#0a1a2e] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_28px_-8px_rgba(0,212,255,0.65)]"
            style={{
              backgroundImage: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
            }}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                {t("link.copied_label")}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {t("link.copy_button")}
              </>
            )}
          </button>
        </div>

        {/* Share buttons */}
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55 mb-2.5">
            {t("link.share_label")}
          </p>
          <div className="flex flex-wrap gap-2">
            <ShareButton href={shareUrls.whatsapp} label="WhatsApp" color="#25D366">
              <WhatsAppIcon />
            </ShareButton>
            <ShareButton href={shareUrls.twitter} label="X / Twitter" color="#ffffff">
              <XIcon />
            </ShareButton>
            <ShareButton href={shareUrls.linkedin} label="LinkedIn" color="#0A66C2">
              <LinkedInIcon />
            </ShareButton>
            <ShareButton href={shareUrls.email} label={t("link.share_email")} color="#00D4FF">
              <Mail className="h-4 w-4" />
            </ShareButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShareButton({
  href, label, color, children,
}: { href: string; label: string; color: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-[12.5px] font-medium text-white/90 hover:bg-white/[0.10] hover:border-white/30 transition-all duration-150"
      style={{ ["--accent" as string]: color }}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center" style={{ color }}>
        {children}
      </span>
      <span>{label}</span>
    </a>
  )
}

// ── Inline brand icons (no extra deps) ─────────────────────────────────────────
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.09.55 4.13 1.6 5.93L2 22l4.32-1.13a9.9 9.9 0 005.72 1.82h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7-1.87-1.87-4.36-2.78-7.02-2.78zM17.5 16.04c-.23.65-1.34 1.24-1.86 1.32-.5.07-1.13.1-1.83-.11-.42-.13-.96-.31-1.66-.61-2.93-1.27-4.85-4.22-5-4.42-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.6-.37.79-.37.2 0 .4 0 .56.01.18.01.42-.07.66.5.23.55.79 1.92.86 2.06.07.13.11.29.02.49-.09.2-.13.3-.26.46-.13.16-.27.36-.39.49-.13.13-.27.27-.12.53.15.27.66 1.09 1.42 1.77 1 .88 1.83 1.16 2.09 1.29.27.13.42.11.58-.07.16-.18.66-.77.84-1.04.18-.27.36-.22.6-.13.24.09 1.55.73 1.82.86.27.13.45.2.52.31.07.11.07.65-.16 1.3z"/>
    </svg>
  )
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2H21l-6.52 7.46L22.5 22h-6.84l-5.34-7.06L4.2 22H1.44l6.98-7.98L1.5 2h6.99l4.83 6.45L18.244 2zm-2.4 18.2h1.9L7.26 3.7H5.22l10.624 16.5z"/>
    </svg>
  )
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M19 3A2 2 0 0121 5v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8.34 18.34V10.5H5.67v7.84h2.67zM7 9.34a1.55 1.55 0 100-3.1 1.55 1.55 0 000 3.1zm11.34 9V14.1c0-2.41-1.29-3.53-3-3.53-1.38 0-2 .76-2.34 1.29v-1.1h-2.67c.04.75 0 7.84 0 7.84h2.67v-4.38c0-.24.02-.47.09-.65.18-.47.62-.96 1.34-.96.95 0 1.33.72 1.33 1.78v4.21h2.58z"/>
    </svg>
  )
}
