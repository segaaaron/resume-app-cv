"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useApplicationStore, type AppStatus, type ApplicationCard } from "@/stores/applicationStore"
import KanbanColumn from "./Column"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { track } from "@/lib/analytics/track"
import { RejectModal, FoundJobModal, ClearBoardModal, RejectionDetailModal } from "./_board-modals"

// ── CSS variables ─────────────────────────────────────────────────────────────

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
      track("application_tracked", { status: "APPLIED" })
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
      track("application_status_changed", { to_status: "WISHLIST" })
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
    track("application_status_changed", { to_status: targetStatus })
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
      {/* ── Page head ─────────────────────────────────────────────────────── */}
      <div className="kanban-header flex items-start justify-between mb-7">
        <div>
          {/* Eyebrow */}
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-dash-cyan mb-1.5 flex items-center gap-[7px]">
            <span className="w-3.5 h-[1.5px] bg-dash-cyan opacity-50 inline-block" />
            {t("section_eyebrow")}
          </div>

          {/* Title */}
          <h1 className="font-bold text-dash-navy tracking-[-0.035em] leading-[1.1] m-0 text-[32px]"
            style={{ fontFamily: "var(--dash-serif)" }}
          >
            {t("page_title")}
          </h1>

          {/* Subtitle */}
          <p className="text-[13.5px] text-dash-muted mt-1.5 mb-0">
            {totalCount !== 1
              ? t("board_subtitle_other", { count: totalCount })
              : t("board_subtitle_one", { count: totalCount })}
          </p>
        </div>

        {/* Limpiar tablero button */}
        {totalCount > 0 && (
          <button
            onClick={() => setClearOpen(true)}
            className={[
              "group inline-flex items-center gap-2",
              "py-[9px] px-4 pl-[14px]",
              "bg-white relative overflow-hidden",
              "border border-dash-border hover:border-red-400/40",
              "rounded-full cursor-pointer",
              "text-[12.5px] font-semibold tracking-[0.01em] [font-family:inherit]",
              "text-dash-muted hover:text-red-600",
              "shadow-[0_1px_2px_rgba(26,46,74,0.04)] hover:shadow-[0_4px_14px_rgba(239,68,68,0.15)]",
              "transition-all duration-[250ms] ease-[cubic-bezier(.2,.8,.2,1)]",
              "hover:-translate-y-px",
              "before:absolute before:inset-0 before:pointer-events-none",
              "before:bg-[linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.02))]",
              "before:opacity-0 hover:before:opacity-100 before:transition-opacity",
            ].join(" ")}
          >
            {/* Trash icon */}
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="relative transition-transform duration-300 ease-in-out group-hover:-rotate-[8deg]"
            >
              <path d="M3 6h18"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
            </svg>
            <span className="relative">{t("clear_board")}</span>
          </button>
        )}
      </div>

      {/* ── Kanban board ───────────────────────────────────────────────────── */}
      <div className="kanban-grid grid grid-cols-5 gap-3 items-start overflow-x-auto pb-6">
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
          className="p-0 overflow-hidden rounded-[14px] max-w-[420px] border border-dash-border shadow-[0_40px_100px_rgba(0,212,255,0.08)]"
        >
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[linear-gradient(90deg,transparent,#00D4FF,transparent)] opacity-30 pointer-events-none" />
          <div className="p-7">
            <DialogClose className="absolute top-4 right-4 w-7 h-7 rounded-[6px] border border-dash-border bg-transparent text-dash-muted cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-[#EEF2F9] hover:border-dash-cyan hover:text-dash-navy">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </DialogClose>

            <div
              className="text-[18px] font-bold text-dash-navy tracking-[-0.03em] mb-[18px]"
              style={{ fontFamily: "var(--dash-serif)" }}
            >
              {t("dialog_title")}
            </div>

            <div className="mb-[14px]">
              <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-dash-muted mb-[5px]">{t("job_title_label")}</div>
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={t("job_title_placeholder")}
                className="w-full bg-[#EEF2F9] border border-dash-border rounded-[6px] px-3 py-2 text-[13px] text-dash-navy [font-family:inherit] outline-none transition-[border-color,box-shadow] duration-150 focus:border-dash-cyan focus:shadow-[0_0_0_2px_rgba(0,212,255,0.08)]"
              />
            </div>

            <div className="mt-3 mb-[14px]">
              <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-dash-muted mb-[5px]">{t("company_label")}</div>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t("company_placeholder")}
                className="w-full bg-[#EEF2F9] border border-dash-border rounded-[6px] px-3 py-2 text-[13px] text-dash-navy [font-family:inherit] outline-none transition-[border-color,box-shadow] duration-150 focus:border-dash-cyan focus:shadow-[0_0_0_2px_rgba(0,212,255,0.08)]"
              />
            </div>

            <div className="mt-3 mb-[14px]">
              <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-dash-muted mb-[5px]">{t("modalidad_label")}</div>
              <select value={modalidad} onChange={(e) => setModalidad(e.target.value)}
                className="w-full bg-[#EEF2F9] border border-dash-border rounded-[6px] px-3 py-2 text-[13px] text-dash-navy [font-family:inherit] outline-none transition-[border-color,box-shadow] duration-150 focus:border-dash-cyan focus:shadow-[0_0_0_2px_rgba(0,212,255,0.08)]"
              >
                {MODALIDADES.map((m) => <option key={m.value} value={m.value}>{t(m.labelKey)}</option>)}
              </select>
            </div>

            <button
              onClick={createApplication}
              disabled={saving || !jobTitle || !company}
              className={[
                "w-full mt-5 flex items-center justify-center",
                "bg-[linear-gradient(135deg,#00D4FF_0%,#00A8CC_100%)] text-white",
                "px-4 py-[11px] text-[13px] font-semibold",
                "border-none rounded-[6px] [font-family:inherit]",
                "transition-all duration-[180ms] ease-in-out",
                saving || !jobTitle || !company ? "cursor-not-allowed opacity-55" : "cursor-pointer",
              ].join(" ")}
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
