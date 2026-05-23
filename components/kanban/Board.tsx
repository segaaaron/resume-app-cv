"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useApplicationStore, type AppStatus, type ApplicationCard } from "@/stores/applicationStore"
import KanbanColumn from "./Column"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { RejectModal, FoundJobModal, ClearBoardModal, RejectionDetailModal } from "./_board-modals"

// ── CSS variables ─────────────────────────────────────────────────────────────
const C = {
  navy:       "#1a2e4a",
  cyan:       "#00D4FF",
  muted:      "#6B7A8C",
  subtle:     "#A0AABE",
  border:     "#D9E1ED",
  danger:     "#EF4444",
} as const

const MODALIDADES = [
  { value: "Remoto",      labelKey: "modalidad_remote" as const },
  { value: "Híbrido",     labelKey: "modalidad_hybrid" as const },
  { value: "Presencial",  labelKey: "modalidad_presencial" as const },
]

// ── Confetti ──────────────────────────────────────────────────────────────────
function burstConfetti() {
  const colors = ["#00D4FF","#1a2e4a","#D4A574","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899"]
  const container = document.createElement("div")
  container.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden"
  document.body.appendChild(container)
  for (let i = 0; i < 120; i++) {
    const el = document.createElement("div")
    const color = colors[Math.floor(Math.random() * colors.length)]
    const x = Math.random() * 100
    const delay = Math.random() * 0.8
    const dur = 2.5 + Math.random() * 1.5
    const size = 6 + Math.random() * 8
    el.style.cssText = `position:absolute;left:${x}%;top:-10px;width:${size}px;height:${size}px;background:${color};border-radius:${Math.random()>0.5?"50%":"2px"};animation:confettiFall ${dur}s ease-in ${delay}s both`
    container.appendChild(el)
  }
  if (!document.getElementById('confetti-keyframes')) {
    const style = document.createElement("style")
    style.id = 'confetti-keyframes'
    style.textContent = `@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`
    document.head.appendChild(style)
    setTimeout(() => style.remove(), 5000)
  }
  setTimeout(() => { container.remove() }, 5000)
}

// ── Board ─────────────────────────────────────────────────────────────────────
export default function KanbanBoard({ initialApplications }: { initialApplications: ApplicationCard[] }) {
  const t = useTranslations("kanban")

  const COLUMNS: { id: AppStatus; label: string }[] = [
    { id: "APPLIED",   label: t("column_applied") },
    { id: "INTERVIEW", label: t("column_interview") },
    { id: "OFFER",     label: t("column_offer") },
    { id: "REJECTED",  label: t("column_rejected") },
    { id: "WISHLIST",  label: t("column_wishlist") },
  ]
  const { applications, setApplications, addApplication, moveApplication, deleteApplication, clearApplications, updateApplication } = useApplicationStore()

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [modalidad, setModalidad] = useState("Remoto")
  const [saving, setSaving] = useState(false)

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<AppStatus | null>(null)
  const prevStatusRef = useRef<AppStatus | null>(null)

  // Reject modal
  const [rejectState, setRejectState] = useState<{ id: string; prevStatus: AppStatus } | null>(null)
  const [rejectChip, setRejectChip] = useState("")
  const [rejectNotes, setRejectNotes] = useState("")

  // Work found modal
  const [foundCard, setFoundCard] = useState<ApplicationCard | null>(null)

  // Clear modal
  const [clearOpen, setClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  // Rejection detail modal
  const [detailApp, setDetailApp] = useState<ApplicationCard | null>(null)

  // Clear button hover state
  const [clearBtnHover, setClearBtnHover] = useState(false)

  useEffect(() => {
    setApplications(initialApplications)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Topbar "Añadir candidatura" event
  useEffect(() => {
    const handler = () => setAddOpen(true)
    document.addEventListener("kanban-open-add", handler)
    return () => document.removeEventListener("kanban-open-add", handler)
  }, [])

  async function createApplication() {
    if (!jobTitle || !company) return
    setSaving(true)
    try {
      const res = await apiFetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company, modalidad, status: "APPLIED" }),
        silent: true,
      })
      if (!res.ok) { toast.error(t("create_error")); return }
      const data: ApplicationCard = await res.json()
      addApplication(data)
      setAddOpen(false)
      setJobTitle(""); setCompany(""); setModalidad("Remoto")
      toast.success(t("create_success"))
    } catch {
      toast.error(t("create_error"))
    } finally {
      setSaving(false)
    }
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────
  function handleDragStart(id: string, currentStatus: AppStatus) {
    setDraggingId(id)
    prevStatusRef.current = currentStatus
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverCol(null)
  }

  function handleDrop(targetStatus: AppStatus) {
    if (!draggingId) return
    const prev = prevStatusRef.current!
    if (targetStatus === prev) { handleDragEnd(); return }

    if (targetStatus === "REJECTED") {
      setRejectState({ id: draggingId, prevStatus: prev })
      setRejectChip(""); setRejectNotes("")
      handleDragEnd()
      return
    }

    if (targetStatus === "WISHLIST") {
      const card = applications.find(a => a.id === draggingId)
      moveApplication(draggingId, "WISHLIST")
      apiFetch(`/api/applications/${draggingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WISHLIST" }),
      }).catch(() => moveApplication(draggingId, prev))
      if (card) { burstConfetti(); setFoundCard(card) }
      handleDragEnd()
      return
    }

    moveApplication(draggingId, targetStatus)
    apiFetch(`/api/applications/${draggingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    }).catch(() => moveApplication(draggingId, prev))
    handleDragEnd()
  }

  // ── Reject confirm ────────────────────────────────────────────────────────
  async function confirmReject() {
    if (!rejectState) return
    const notes = [rejectChip, rejectNotes].filter(Boolean).join(" — ")
    moveApplication(rejectState.id, "REJECTED")
    updateApplication(rejectState.id, { notes })
    await apiFetch(`/api/applications/${rejectState.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED", notes }),
    }).catch(() => moveApplication(rejectState.id, rejectState.prevStatus))
    setRejectState(null)
  }

  function cancelReject() { setRejectState(null) }

  // ── Clear board ───────────────────────────────────────────────────────────
  async function clearBoard() {
    setClearing(true)
    try {
      const res = await apiFetch("/api/applications", { method: "DELETE" })
      if (!res.ok) { toast.error("Error al limpiar"); return }
      clearApplications()
      setClearOpen(false)
      toast.success("Tablero limpiado")
    } catch {
      toast.error("Error al limpiar")
    } finally {
      setClearing(false)
    }
  }

  const totalCount = applications.length

  return (
    <>
      {/* ── Keyframes injected once ─────────────────────────────────────── */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes stampIn {
          0%   { transform: translate(-50%,-50%) rotate(-14deg) scale(2.4); opacity: 0; }
          60%  { transform: translate(-50%,-50%) rotate(-14deg) scale(0.92); opacity: 1; }
          100% { transform: translate(-50%,-50%) rotate(-14deg) scale(1); opacity: 0.92; }
        }
        @keyframes sealSpin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .kanban-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .kanban-grid   { grid-template-columns: 1fr !important; overflow-x: unset !important; }
        }
      `}</style>

      {/* ── Page head ─────────────────────────────────────────────────────── */}
      <div className="kanban-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          {/* Eyebrow */}
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: C.cyan,
            marginBottom: 6,
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <span style={{ width: 14, height: 1.5, background: C.cyan, opacity: 0.5, display: "inline-block" }} />
            {t("section_eyebrow")}
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "var(--dash-serif)",
            fontSize: 32, fontWeight: 700, color: C.navy,
            letterSpacing: "-0.035em", lineHeight: 1.1,
            margin: 0,
          }}>
            {t("page_title")}
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: "13.5px", color: C.muted, marginTop: 6, margin: "6px 0 0" }}>
            {totalCount !== 1
              ? t("board_subtitle_other", { count: totalCount })
              : t("board_subtitle_one", { count: totalCount })}
          </p>
        </div>

        {/* Limpiar tablero button */}
        {totalCount > 0 && (
          <button
            onClick={() => setClearOpen(true)}
            onMouseEnter={() => setClearBtnHover(true)}
            onMouseLeave={() => setClearBtnHover(false)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "9px 16px 9px 14px",
              background: "white",
              border: clearBtnHover ? "1px solid rgba(239,68,68,0.4)" : `1px solid ${C.border}`,
              borderRadius: 999,
              fontFamily: "inherit", fontSize: "12.5px", fontWeight: 600,
              letterSpacing: "0.01em",
              color: clearBtnHover ? "#DC2626" : C.muted,
              cursor: "pointer",
              position: "relative", overflow: "hidden",
              transition: "all 0.25s cubic-bezier(.2,.8,.2,1)",
              boxShadow: clearBtnHover
                ? "0 4px 14px rgba(239,68,68,0.15)"
                : "0 1px 2px rgba(26,46,74,0.04)",
              transform: clearBtnHover ? "translateY(-1px)" : "none",
            }}
          >
            {/* ::before gradient on hover */}
            {clearBtnHover && (
              <span style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.02))",
                pointerEvents: "none",
              }} />
            )}
            {/* Trash icon */}
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{
                position: "relative",
                transition: "transform 0.3s ease",
                transform: clearBtnHover ? "rotate(-8deg)" : "none",
              }}
            >
              <path d="M3 6h18"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
            </svg>
            <span style={{ position: "relative" }}>{t("clear_board")}</span>
          </button>
        )}
      </div>

      {/* ── Kanban board ───────────────────────────────────────────────────── */}
      <div className="kanban-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 12,
        alignItems: "start",
        overflowX: "auto",
        paddingBottom: 24,
      }}>
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            label={col.label}
            color=""
            applications={applications.filter((a) => a.status === col.id)}
            draggingId={draggingId}
            dragOver={dragOverCol === col.id}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={() => setDragOverCol(col.id)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={() => handleDrop(col.id)}
            onDelete={(id) => {
              deleteApplication(id)
              apiFetch(`/api/applications/${id}`, { method: "DELETE" }).catch(() => {
                toast.error(t("delete_error"))
              })
            }}
            onViewDetail={(app) => setDetailApp(app)}
          />
        ))}
      </div>

      {/* ── Add candidatura dialog ─────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) { setJobTitle(""); setCompany(""); setModalidad("Remoto") } }}>
        <DialogContent
          showCloseButton={false}
          className="p-0 overflow-hidden"
          style={{ borderRadius: "14px", maxWidth: "420px", border: "1px solid #D9E1ED", boxShadow: "0 40px 100px rgba(0,212,255,0.08)" }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1.5px", background: "linear-gradient(90deg, transparent, #00D4FF, transparent)", opacity: 0.3, pointerEvents: "none" }} />
          <div style={{ padding: "28px" }}>
            <DialogClose
              style={{ position: "absolute", top: "16px", right: "16px", width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #D9E1ED", background: "transparent", color: "#6B7A8C", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "#EEF2F9"; el.style.borderColor = "#00D4FF"; el.style.color = "#1a2e4a" }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.borderColor = "#D9E1ED"; el.style.color = "#6B7A8C" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </DialogClose>

            <div style={{ fontFamily: "var(--dash-serif)", fontSize: "18px", fontWeight: 700, color: "#1a2e4a", letterSpacing: "-0.03em", marginBottom: "18px" }}>
              {t("dialog_title")}
            </div>

            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B7A8C", marginBottom: "5px" }}>{t("job_title_label")}</div>
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={t("job_title_placeholder")}
                style={{ width: "100%", background: "#EEF2F9", border: "1px solid #D9E1ED", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", color: "#1a2e4a", fontFamily: "inherit", outline: "none", transition: "border-color 0.15s ease, box-shadow 0.15s ease" }}
                onFocus={(e) => { e.target.style.borderColor = "#00D4FF"; e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.08)" }}
                onBlur={(e) => { e.target.style.borderColor = "#D9E1ED"; e.target.style.boxShadow = "none" }}
              />
            </div>

            <div style={{ marginTop: "12px", marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B7A8C", marginBottom: "5px" }}>{t("company_label")}</div>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t("company_placeholder")}
                style={{ width: "100%", background: "#EEF2F9", border: "1px solid #D9E1ED", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", color: "#1a2e4a", fontFamily: "inherit", outline: "none", transition: "border-color 0.15s ease, box-shadow 0.15s ease" }}
                onFocus={(e) => { e.target.style.borderColor = "#00D4FF"; e.target.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.08)" }}
                onBlur={(e) => { e.target.style.borderColor = "#D9E1ED"; e.target.style.boxShadow = "none" }}
              />
            </div>

            <div style={{ marginTop: "12px", marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B7A8C", marginBottom: "5px" }}>{t("modalidad_label")}</div>
              <select value={modalidad} onChange={(e) => setModalidad(e.target.value)}
                style={{ width: "100%", background: "#EEF2F9", border: "1px solid #D9E1ED", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", color: "#1a2e4a", fontFamily: "inherit", outline: "none", transition: "border-color 0.15s ease, box-shadow 0.15s ease" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00D4FF"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.08)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#D9E1ED"; e.currentTarget.style.boxShadow = "none" }}
              >
                {MODALIDADES.map((m) => <option key={m.value} value={m.value}>{t(m.labelKey)}</option>)}
              </select>
            </div>

            <button
              onClick={createApplication}
              disabled={saving || !jobTitle || !company}
              style={{ width: "100%", marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)", color: "white", padding: "11px 16px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "6px", cursor: saving || !jobTitle || !company ? "not-allowed" : "pointer", opacity: saving || !jobTitle || !company ? 0.55 : 1, fontFamily: "inherit", transition: "all 0.18s ease" }}
            >
              {t("add")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <RejectModal
        rejectState={rejectState}
        rejectChip={rejectChip}
        setRejectChip={setRejectChip}
        rejectNotes={rejectNotes}
        setRejectNotes={setRejectNotes}
        onConfirm={confirmReject}
        onCancel={cancelReject}
      />
      <FoundJobModal foundCard={foundCard} onClose={() => setFoundCard(null)} />
      <RejectionDetailModal app={detailApp} onClose={() => setDetailApp(null)} />
      <ClearBoardModal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={clearBoard}
        clearing={clearing}
        totalCount={totalCount}
      />
    </>
  )
}
