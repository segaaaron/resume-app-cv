import { Mail, AlertTriangle } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { db } from "@/lib/db"
import { periodOf, resolveMonthlyLimit } from "@/lib/services/email/quota"
import LocalTime from "./LocalTime"

/**
 * Consumo de correo del mes, con el número que reporta Resend.
 *
 * Server Component: lee la tabla directamente. No hay endpoint porque no hay nada que
 * pedirle al cliente — el panel de admin ya es `force-dynamic` y corre en el servidor.
 */
export default async function EmailQuotaPanel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "dashboard_admin" })

  const period = periodOf(new Date())
  const rows = await db.emailQuota.findMany({
    orderBy: { period: "desc" },
    take: 7,
    select: {
      period: true, monthlyRaw: true, dailyRaw: true,
      monthlyUsed: true, monthlyLimit: true, lastSeenAt: true,
    },
  })
  const current = rows.find((r) => r.period === period) ?? null
  const history = rows.filter((r) => r.period !== period)

  // null = cuenta de pago sin tope declarado. Ver resolveMonthlyLimit: inventar 3000 acá
  // encendía la alarma roja con envíos perfectamente legítimos.
  const limit = current ? resolveMonthlyLimit(current) : null
  const used = current?.monthlyUsed ?? null
  const pct = used !== null && limit !== null && limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const over = used !== null && limit !== null && used >= limit
  const near = used !== null && limit !== null && !over && pct >= 80

  // Verde / ámbar / rojo. El umbral del 80% no es estético: es donde Resend manda su
  // primer aviso, así que el panel cambia de color el mismo día que llega ese correo.
  const bar = over ? "#DC2626" : near ? "#D97706" : "#0EA5A4"
  const fmt = (n: number) => n.toLocaleString(locale === "en" ? "en-US" : "es-ES")

  return (
    <div className="dash-card-in mb-7" style={{ animationDelay: "121ms" }}>
      <div className="rounded-[14px] border border-[rgba(26,46,74,0.12)] bg-gradient-to-br from-white via-white to-[#f2f7fd] shadow-[0_4px_20px_rgba(15,25,45,0.05)] p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a2e4a] to-[#2d4f7c] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(26,46,74,0.28)]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#1a2e4a] tracking-[-0.01em]">
                {t("email_quota_title")}
              </div>
              <div className="text-[11.5px] text-[#6B7A8C] mt-px">
                {t("email_quota_subtitle")}
              </div>
            </div>
          </div>
          {current && (
            <span className="shrink-0 text-[10.5px] font-semibold px-2.5 py-1 rounded-full border border-[rgba(26,46,74,0.14)] bg-white text-[#4A5A6C]">
              {/* La cabecera diaria SOLO llega a cuentas gratuitas: su ausencia es el dato. */}
              {current.dailyRaw ? t("email_quota_free_plan") : t("email_quota_paid_plan")}
            </span>
          )}
        </div>

        {!current ? (
          <p className="text-[12.5px] text-[#6B7A8C] m-0 leading-relaxed">{t("email_quota_empty")}</p>
        ) : used === null ? (
          // Nunca mostrar 0: un formato ilegible no es "no enviamos nada".
          <p className="text-[12.5px] text-[#6B7A8C] m-0 leading-relaxed">
            {t("email_quota_unparsed")}{" "}
            <code className="px-1.5 py-0.5 rounded bg-[#eef3f9] text-[#1a2e4a] font-mono">{current.monthlyRaw}</code>
          </p>
        ) : (
          <>
            <div className="flex items-baseline gap-2 mb-2.5">
              <span className="text-[30px] font-extrabold text-[#1a2e4a] tracking-[-0.02em] leading-none tabular-nums">
                {fmt(used)}
              </span>
              <span className="text-[13px] text-[#6B7A8C] font-medium">
                {limit !== null
                  ? `${t("email_quota_of")} ${fmt(limit)} ${t("email_quota_used")}`
                  : t("email_quota_used")}
              </span>
            </div>

            {/* Sin tope conocido no se dibuja barra: una barra necesita un denominador. */}
            {limit !== null && (
              <div className="h-2 w-full rounded-full bg-[#e6edf5] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.max(pct, used > 0 ? 2 : 0)}%`, background: `linear-gradient(90deg, ${bar}, ${bar}cc)` }}
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3 mt-2.5">
              <span className="text-[11.5px] text-[#6B7A8C] tabular-nums">
                {limit !== null
                  ? t("email_quota_remaining", { n: fmt(Math.max(0, limit - used)) })
                  : t("email_quota_no_limit")}
              </span>
              <span className="text-[11px] text-[#8A97A6] tabular-nums">
                {t("email_quota_updated")}: <LocalTime iso={current.lastSeenAt.toISOString()} />
              </span>
            </div>

            {(over || near) && (
              <div
                className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-[10px] border text-[11.5px] font-semibold ${
                  over
                    ? "border-[rgba(220,38,38,0.25)] bg-[#fef2f2] text-[#B91C1C]"
                    : "border-[rgba(217,119,6,0.25)] bg-[#fffbeb] text-[#B45309]"
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {over ? t("email_quota_over") : t("email_quota_near")}
              </div>
            )}
          </>
        )}

        {history.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-[rgba(26,46,74,0.08)]">
            <div className="text-[10.5px] font-bold text-[#8A97A6] uppercase tracking-[0.08em] mb-2">
              {t("email_quota_history")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {history.map((h) => (
                <span
                  key={h.period}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-[rgba(26,46,74,0.1)] bg-white text-[#4A5A6C] tabular-nums"
                >
                  {h.period} · <b className="text-[#1a2e4a]">{h.monthlyUsed !== null ? fmt(h.monthlyUsed) : h.monthlyRaw}</b>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
