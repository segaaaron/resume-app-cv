"use client"

import { useState } from "react"
import type { AppStatus, ApplicationCard } from "@/stores/applicationStore"
import { useApplicationStore } from "@/stores/applicationStore"
import { Badge } from "@/components/ui/badge"
import { Trash2, ExternalLink, Bell, BellOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface Props {
  columnId: AppStatus
  label: string
  color: string
  applications: ApplicationCard[]
}

export default function KanbanColumn({ columnId, label, color, applications }: Props) {
  const t = useTranslations("kanban")
  const { moveApplication, deleteApplication, updateApplication } = useApplicationStore()
  const [editingReminder, setEditingReminder] = useState<string | null>(null)

  async function handleMove(id: string, status: AppStatus) {
    const prev = applications.find((a) => a.id === id)?.status
    moveApplication(id, status)
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
    } catch {
      if (prev) moveApplication(id, prev)
      toast.error(t("move_error"))
    }
  }

  async function handleDelete(id: string) {
    deleteApplication(id)
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success(t("delete_success"))
    } catch {
      toast.error(t("delete_error"))
    }
  }

  async function handleFollowUp(id: string, date: string | null) {
    try {
      const followUpAt = date ? new Date(date).toISOString() : null
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpAt }),
      })
      if (!res.ok) throw new Error()
      updateApplication(id, { followUpAt })
      setEditingReminder(null)
      toast.success(date ? t("follow_up_set") : t("follow_up_removed"))
    } catch {
      toast.error(t("follow_up_error"))
    }
  }

  const STATUSES: AppStatus[] = ["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"]
  const STATUS_LABELS: Record<AppStatus, string> = {
    WISHLIST: t("status_wishlist"),
    APPLIED: t("status_applied"),
    INTERVIEW: t("status_interview"),
    OFFER: t("status_offer"),
    REJECTED: t("status_rejected"),
  }

  return (
    <div className={cn("rounded-xl p-3 min-h-[400px]", color)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">{label}</h3>
        <Badge variant="secondary" className="text-xs h-5 px-1.5">{applications.length}</Badge>
      </div>

      <div className="space-y-2">
        {applications.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{app.jobTitle}</p>
                <p className="text-xs text-muted-foreground truncate">{app.company}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditingReminder(editingReminder === app.id ? null : app.id)}
                  className={cn(
                    "transition-colors",
                    app.followUpAt
                      ? "text-primary hover:text-primary/70"
                      : "text-muted-foreground hover:text-primary"
                  )}
                  title={t("follow_up_label")}
                >
                  {app.followUpAt ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(app.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Reminder display */}
            {app.followUpAt && editingReminder !== app.id && (
              <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                <Bell className="h-2.5 w-2.5" />
                {new Date(app.followUpAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </p>
            )}

            {/* Reminder picker */}
            {editingReminder === app.id && (
              <div className="mt-2 flex items-center gap-1.5">
                <input
                  type="date"
                  defaultValue={app.followUpAt ? app.followUpAt.slice(0, 10) : ""}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => handleFollowUp(app.id, e.target.value || null)}
                  className="text-xs border border-border rounded px-1.5 py-0.5 flex-1 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {app.followUpAt && (
                  <button
                    onClick={() => handleFollowUp(app.id, null)}
                    className="text-[10px] text-destructive hover:underline"
                  >
                    {t("follow_up_removed")}
                  </button>
                )}
              </div>
            )}

            {app.url && (
              <a href={app.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline">
                <ExternalLink className="h-3 w-3" /> {t("view_offer")}
              </a>
            )}

            {/* Move buttons */}
            <div className="flex gap-1 mt-2 flex-wrap">
              {STATUSES.filter((s) => s !== columnId).map((status) => (
                <button
                  key={status}
                  onClick={() => handleMove(app.id, status)}
                  className="text-[10px] text-muted-foreground hover:text-foreground border border-border rounded px-1.5 py-0.5 transition-colors"
                >
                  → {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
