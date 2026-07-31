"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { useTranslations } from "next-intl"
import { apiFetch } from "@/lib/apiFetch"
import {
  UserPlus, Loader2, Ban, CheckCircle2, Trash2, AlertCircle,
  Infinity as InfinityIcon, Copy, Check, Pencil, RotateCcw, KeyRound,
} from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ManagedUser {
  id: string; email: string; managedExpiresAt: string | null
  managedBlocked: boolean; managedDownloadsUsed: number | null
  managedDownloadLimit: number | null; managedNote: string | null; createdAt: string
  managedResumeLimit: number | null; managedCoverLetterLimit: number | null
}

type Banner = { kind: "success" | "error"; msg: string; password?: string } | null

export default function ManagedUsersPanel() {
  const t = useTranslations("dashboard_admin.managed")

  const [users, setUsers]       = useState<ManagedUser[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [rowLoading, setRowLoading]   = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ManagedUser | null>(null)
  const [editTarget, setEditTarget]   = useState<ManagedUser | null>(null)
  const [editExpiry, setEditExpiry]   = useState("")
  const [editLimit, setEditLimit]     = useState("")
  const [editResumeLimit, setEditResumeLimit] = useState("")
  const [editCoverLimit, setEditCoverLimit]   = useState("")
  const [banner, setBanner]           = useState<Banner>(null)
  const [copied, setCopied]           = useState(false)

  const [email, setEmail]               = useState("")
  const [expiresAt, setExpiresAt]       = useState("")
  const [downloadLimit, setDownloadLimit] = useState("")
  const [resumeLimit, setResumeLimit]   = useState("")
  const [coverLimit, setCoverLimit]     = useState("")
  const [note, setNote]                 = useState("")

  const fetchList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await apiFetch(`/api/admin/users/managed/list`, { silent: true })
      if (res.ok) {
        const d = await res.json()
        setUsers(Array.isArray(d) ? d : [])
      }
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  function resetForm() { setEmail(""); setExpiresAt(""); setDownloadLimit(""); setResumeLimit(""); setCoverLimit(""); setNote("") }

  function copyPassword(pw: string) {
    navigator.clipboard.writeText(pw).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setBanner(null)
    if (!email.trim() || !expiresAt) { setBanner({ kind: "error", msg: t("form_error_required") }); return }
    if (new Date(expiresAt) <= new Date()) { setBanner({ kind: "error", msg: t("form_error_past_date") }); return }
    setSubmitting(true)
    try {
      const res = await apiFetch("/api/admin/users/managed", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(), expiresAt: new Date(expiresAt).toISOString(),
          ...(downloadLimit ? { downloadLimit: Number(downloadLimit) } : {}),
          ...(resumeLimit ? { resumeLimit: Number(resumeLimit) } : {}),
          ...(coverLimit ? { coverLetterLimit: Number(coverLimit) } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setBanner({ kind: "success", msg: t("form_success", { email: email.trim() }), password: data.generatedPassword })
        resetForm(); fetchList(); return
      }
      const code = data?.code as string | undefined
      if (code === "STRIPE_ACTIVE") setBanner({ kind: "error", msg: t("form_error_stripe_active") })
      else if (code === "EMAIL_EXISTS") setBanner({ kind: "error", msg: t("form_error_email_exists") })
      else setBanner({ kind: "error", msg: data?.error ?? t("form_error_generic") })
    } catch { setBanner({ kind: "error", msg: t("form_error_generic") })
    } finally { setSubmitting(false) }
  }

  async function patchUser(id: string, body: object) {
    setRowLoading(id)
    try {
      const res = await apiFetch(`/api/admin/users/managed/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        if (data?.generatedPassword) {
          setBanner({ kind: "success", msg: t("password_reset_success"), password: data.generatedPassword })
        }
        fetchList()
      } else {
        setBanner({ kind: "error", msg: data?.error ?? t("form_error_generic") })
      }
    } finally { setRowLoading(null) }
  }

  async function handleEdit() {
    if (!editTarget || !editExpiry) return
    if (new Date(editExpiry) <= new Date()) {
      setBanner({ kind: "error", msg: t("form_error_past_date") })
      setEditTarget(null)
      return
    }
    await patchUser(editTarget.id, {
      action: "edit",
      expiresAt: new Date(editExpiry).toISOString(),
      ...(editLimit ? { downloadLimit: Number(editLimit) } : { downloadLimit: null }),
      ...(editResumeLimit ? { resumeLimit: Number(editResumeLimit) } : { resumeLimit: null }),
      ...(editCoverLimit ? { coverLetterLimit: Number(editCoverLimit) } : { coverLetterLimit: null }),
    })
    setEditTarget(null)
  }

  async function deleteUser(u: ManagedUser) {
    setRowLoading(u.id)
    try {
      const res = await apiFetch(`/api/admin/users/managed/${u.id}`, { method: "DELETE" })
      if (res.ok) fetchList()
    } finally { setRowLoading(null); setConfirmDelete(null) }
  }

  function openEdit(u: ManagedUser) {
    setEditTarget(u)
    setEditExpiry(u.managedExpiresAt ? format(new Date(u.managedExpiresAt), "yyyy-MM-dd") : "")
    setEditLimit(u.managedDownloadLimit?.toString() ?? "")
    setEditResumeLimit(u.managedResumeLimit?.toString() ?? "")
    setEditCoverLimit(u.managedCoverLetterLimit?.toString() ?? "")
  }

  function statusOf(u: ManagedUser): "active" | "blocked" | "expired" {
    if (u.managedBlocked) return "blocked"
    if (u.managedExpiresAt && new Date(u.managedExpiresAt) <= new Date()) return "expired"
    return "active"
  }

  return (
    <div className="flex flex-col gap-7">

      {/* ── Create form ── */}
      <div className="rounded-2xl overflow-hidden border border-[rgba(0,212,255,0.18)] shadow-[0_8px_32px_rgba(15,25,45,0.06)] bg-gradient-to-br from-[#eef4fb] via-white to-[#dbe6f3]">
        <div className="px-6 pt-5 pb-4 border-b border-[rgba(0,212,255,0.15)] flex items-center gap-3 bg-white/40 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(0,212,255,0.35)]">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="[font-family:var(--dash-serif,'Playfair_Display',Georgia,serif)] text-[16px] font-bold text-[#1a2e4a] tracking-[-0.02em]">{t("form_title")}</div>
            <div className="text-[12px] text-[#6B7A8C] mt-px">{t("form_subtitle")}</div>
          </div>
        </div>

        <form onSubmit={handleCreate} className="px-6 py-5">
          {banner && (
            <div className={`mb-4 rounded-xl border px-4 py-3 text-[13px] ${banner.kind === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              <div className="flex items-start gap-2">
                {banner.kind === "success" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                <span>{banner.msg}</span>
              </div>
              {banner.password && (
                <div className="mt-3 rounded-lg border border-[rgba(0,212,255,0.3)] bg-[#0f172a] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[14px] tracking-widest text-[#00D4FF] select-all">{banner.password}</span>
                    <button type="button" onClick={() => copyPassword(banner.password!)} className="shrink-0 p-1.5 rounded-md hover:bg-white/10 text-[#00D4FF] transition-colors" aria-label="Copiar contraseña">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-amber-300 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {t("password_one_time_warning")}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("field_email")} required>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" required className={inputCls} />
            </Field>
            <Field label={t("field_expires_at")} required>
              <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} required className={inputCls} />
            </Field>
            <Field label={t("field_download_limit")}>
              <input type="number" min={1} value={downloadLimit} onChange={e => setDownloadLimit(e.target.value)} placeholder={t("field_download_limit_placeholder")} className={inputCls} />
            </Field>
            <Field label={t("field_resume_limit")}>
              <input type="number" min={1} value={resumeLimit} onChange={e => setResumeLimit(e.target.value)} placeholder={t("field_content_limit_placeholder")} className={inputCls} />
            </Field>
            <Field label={t("field_cover_limit")}>
              <input type="number" min={1} value={coverLimit} onChange={e => setCoverLimit(e.target.value)} placeholder={t("field_content_limit_placeholder")} className={inputCls} />
            </Field>
            <Field label={t("field_note")} hint={`${note.length}/500`}>
              <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 500))} rows={2} placeholder={t("field_note_placeholder")} className={`${inputCls} resize-none`} />
            </Field>
          </div>

          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] shadow-[0_4px_16px_rgba(0,212,255,0.3)] hover:shadow-[0_6px_22px_rgba(0,212,255,0.4)] hover:-translate-y-px transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {t("form_submit")}
            </button>
          </div>
        </form>
      </div>

      {/* ── List ── */}
      <div className="rounded-2xl overflow-hidden border border-[#D9E1ED] bg-white shadow-[0_8px_32px_rgba(15,25,45,0.04)]">
        <div className="px-6 pt-5 pb-4 border-b border-[#D9E1ED]">
          <div className="[font-family:var(--dash-serif,'Playfair_Display',Georgia,serif)] text-[16px] font-bold text-[#1a2e4a] tracking-[-0.02em]">{t("list_title")}</div>
          <div className="text-[12px] text-[#6B7A8C] mt-px">{t("list_subtitle", { count: users.length })}</div>
        </div>

        {listLoading ? (
          <div className="px-6 py-10 flex items-center justify-center text-[#6B7A8C]"><Loader2 className="w-5 h-5 animate-spin mr-2" />{t("list_loading")}</div>
        ) : users.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13px] text-[#6B7A8C]">{t("list_empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="bg-[#F7F9FC]">
                  {["col_email","col_expires","col_downloads","col_status","col_note","col_actions"].map(k => (
                    <Th key={k} className={k === "col_actions" ? "text-right" : ""}>{t(k)}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const status = statusOf(u)
                  const td = `px-4 py-3 text-[12.5px] align-middle ${i < users.length - 1 ? "border-b border-[#EEF1F5]" : ""}`
                  return (
                    <tr key={u.id} className="group hover:bg-[rgba(0,212,255,0.04)]">
                      <td className={`${td} font-mono font-medium text-[#1a2e4a]`}>{u.email}</td>
                      <td className={`${td} text-[#4B5A6C]`}>
                        {u.managedExpiresAt ? <span className="font-mono">{format(new Date(u.managedExpiresAt), "dd MMM yyyy")}</span> : "—"}
                      </td>
                      <td className={`${td} text-[#4B5A6C]`}>
                        {u.managedDownloadLimit == null
                          ? <span className="inline-flex items-center gap-1 text-[#6B7A8C]"><InfinityIcon className="w-3.5 h-3.5" /></span>
                          : <span className="font-mono">{u.managedDownloadsUsed ?? 0} / {u.managedDownloadLimit}</span>}
                      </td>
                      <td className={td}><StatusBadge status={status} t={t} /></td>
                      <td className={`${td} text-[#6B7A8C] max-w-[160px] truncate`} title={u.managedNote ?? ""}>{u.managedNote || "—"}</td>
                      <td className={`${td} text-right`}>
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          <ActionBtn onClick={() => openEdit(u)} disabled={rowLoading === u.id} title={t("action_edit")} variant="sky">
                            <Pencil className="w-3 h-3" />{t("action_edit")}
                          </ActionBtn>
                          <ActionBtn onClick={() => patchUser(u.id, { action: u.managedBlocked ? "unblock" : "block" })} disabled={rowLoading === u.id} title={u.managedBlocked ? t("action_unblock") : t("action_block")} variant={u.managedBlocked ? "green" : "amber"}>
                            {rowLoading === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (u.managedBlocked ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />)}
                            {u.managedBlocked ? t("action_unblock") : t("action_block")}
                          </ActionBtn>
                          <ActionBtn onClick={() => patchUser(u.id, { action: "reset-downloads" })} disabled={rowLoading === u.id} title={t("action_reset_downloads")} variant="slate">
                            <RotateCcw className="w-3 h-3" />
                          </ActionBtn>
                          <ActionBtn onClick={() => patchUser(u.id, { action: "reset-password" })} disabled={rowLoading === u.id} title={t("action_reset_password")} variant="slate">
                            <KeyRound className="w-3 h-3" />
                          </ActionBtn>
                          <ActionBtn onClick={() => setConfirmDelete(u)} disabled={rowLoading === u.id} title={t("action_delete")} variant="red">
                            <Trash2 className="w-3 h-3" />
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit modal ── */}
      <AlertDialog open={!!editTarget} onOpenChange={o => !o && setEditTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("edit_dialog_title")}</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-mono text-[#6B7A8C]">{editTarget?.email}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Field label={t("field_expires_at")} required>
              <input type="date" value={editExpiry} onChange={e => setEditExpiry(e.target.value)} required className={inputCls} />
            </Field>
            <Field label={t("field_download_limit")}>
              <input type="number" min={1} value={editLimit} onChange={e => setEditLimit(e.target.value)} placeholder={t("field_download_limit_placeholder")} className={inputCls} />
            </Field>
            <Field label={t("field_resume_limit")}>
              <input type="number" min={1} value={editResumeLimit} onChange={e => setEditResumeLimit(e.target.value)} placeholder={t("field_content_limit_placeholder")} className={inputCls} />
            </Field>
            <Field label={t("field_cover_limit")}>
              <input type="number" min={1} value={editCoverLimit} onChange={e => setEditCoverLimit(e.target.value)} placeholder={t("field_content_limit_placeholder")} className={inputCls} />
            </Field>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("edit_cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleEdit} className="bg-[#00A8CC] text-white hover:bg-[#0090B0]">{t("edit_confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_dialog_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete_dialog_desc", { email: confirmDelete?.email ?? "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("delete_cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && deleteUser(confirmDelete)} className="bg-red-600 text-white hover:bg-red-700">{t("delete_confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Subcomponents ──────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[#D9E1ED] bg-white text-[13px] text-[#1a2e4a] placeholder:text-[#9AA7B8] focus:outline-none focus:border-[#00D4FF] focus:ring-2 focus:ring-[rgba(0,212,255,0.15)] transition-all duration-150"

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#6B7A8C]">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
        {hint && <span className="text-[10.5px] text-[#9AA7B8]">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#6B7A8C] border-b border-[#E2E8F0] ${className}`}>{children}</th>
}

const variantCls: Record<string, string> = {
  sky:   "border-sky-300 text-sky-700 bg-sky-50 hover:bg-sky-100",
  green: "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100",
  amber: "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100",
  red:   "border-red-300 text-red-700 bg-red-50 hover:bg-red-100",
  slate: "border-slate-300 text-slate-600 bg-slate-50 hover:bg-slate-100",
}

function ActionBtn({ onClick, disabled, title, variant, children }: { onClick: () => void; disabled?: boolean; title: string; variant: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={title} className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold border transition-all duration-150 disabled:opacity-60 ${variantCls[variant] ?? variantCls.slate}`}>
      {children}
    </button>
  )
}

function StatusBadge({ status, t }: { status: "active" | "blocked" | "expired"; t: (k: string) => string }) {
  const cfg = {
    active:  { dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.15)]", label: t("status_active") },
    blocked: { dot: "bg-amber-500",   cls: "bg-amber-50 text-amber-700 border-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.15)]",   label: t("status_blocked") },
    expired: { dot: "bg-red-500",     cls: "bg-red-50 text-red-700 border-red-200 shadow-[0_0_12px_rgba(239,68,68,0.15)]",           label: t("status_expired") },
  }[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
    </span>
  )
}
