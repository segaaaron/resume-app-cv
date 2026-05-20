"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useApplicationStore, type AppStatus, type ApplicationCard } from "@/stores/applicationStore"
import KanbanColumn from "./Column"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { RejectModal, FoundJobModal, ClearBoardModal, REJECT_CHIPS } from "./_board-modals"

// ── CSS variables ─────────────────────────────────────────────────────────────
const C = {
  navy:       "#1a2e4a",
  cyan:       "#00D4FF",
  muted:      "#6B7A8C",
  subtle:     "#A0AABE",
  border:     "#D9E1ED",
  danger:     "#EF4444",
} as const

const MODALIDADES = ["Directo", "Referido", "LinkedIn", "Job board", "Híbrido", "Remoto"]

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

// ── Column definitions ────────────────────────────────────────────────────────
const COLUMNS: { id: AppStatus; label: string }[] = [
  { id: "WISHLIST",  label: "★ ¡Trabajo encontrado!" },
  { id: "APPLIED",   label: "Postulados" },
  { id: "INTERVIEW", label: "Entrevista" },
  { id: "OFFER",     label: "Oferta" },
  { id: "REJECTED",  label: "Rechazado" },
]

// ── Board ─────────────────────────────────────────────────────────────────────
export default function KanbanBoard({ initialApplications }: { initialApplications: ApplicationCard[] }) {
  const t = useTranslations("kanban")
  const { applications, setApplications, addApplication, moveApplication, deleteApplication, clearApplications, updateApplication } = useApplicationStore()

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [modalidad, setModalidad] = useState("Directo")
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
      })
      if (!res.ok) { toast.error(t("create_error")); return }
      const data: ApplicationCard = await res.json()
      addApplication(data)
      setAddOpen(false)
      setJobTitle(""); setCompany(""); setModalidad("Directo")
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
      `}</style>

      {/* ── Page head ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          {/* Eyebrow */}
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: C.cyan,
            marginBottom: 6,
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <span style={{ width: 14, height: 1.5, background: C.cyan, opacity: 0.5, display: "inline-block" }} />
            Seguimiento
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "Georgia,serif",
            fontSize: 32, fontWeight: 700, color: C.navy,
            letterSpacing: "-0.035em", lineHeight: 1.1,
            margin: 0,
          }}>
            Mis Candidaturas
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: "13.5px", color: C.muted, marginTop: 6, margin: "6px 0 0" }}>
            {totalCount} candidatura{totalCount !== 1 ? "s" : ""} activa{totalCount !== 1 ? "s" : ""} · Kanban de postulaciones
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
            <span style={{ position: "relative" }}>Limpiar tablero</span>
          </button>
        )}
      </div>

      {/* ── Kanban board ───────────────────────────────────────────────────── */}
      <div style={{
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
              apiFetch(`/api/applications/${id}`, { method: "DELETE" }).catch(() => {})
            }}
            onAddClick={() => setAddOpen(true)}
          />
        ))}
      </div>

      {/* ── Add candidatura dialog ─────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dialog_title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">{t("job_title_label")}</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={t("job_title_placeholder")}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">{t("company_label")}</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t("company_placeholder")}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Modalidad</Label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ borderColor: C.border }}
              >
                {MODALIDADES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <Button
              className="w-full"
              onClick={createApplication}
              disabled={saving || !jobTitle || !company}
            >
              {t("add")}
            </Button>
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
