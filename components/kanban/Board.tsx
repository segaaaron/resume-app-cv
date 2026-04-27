"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useApplicationStore, type AppStatus, type ApplicationCard } from "@/stores/applicationStore"
import KanbanColumn from "./Column"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { toast } from "sonner"

export default function KanbanBoard({ initialApplications }: { initialApplications: ApplicationCard[] }) {
  const t = useTranslations("kanban")
  const { applications, setApplications, addApplication } = useApplicationStore()
  const [open, setOpen] = useState(false)
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [saving, setSaving] = useState(false)

  const COLUMNS: { id: AppStatus; labelKey: keyof ReturnType<typeof t> }[] = [
    { id: "WISHLIST", labelKey: "status_wishlist" as never },
    { id: "APPLIED", labelKey: "status_applied" as never },
    { id: "INTERVIEW", labelKey: "status_interview" as never },
    { id: "OFFER", labelKey: "status_offer" as never },
    { id: "REJECTED", labelKey: "status_rejected" as never },
  ]

  useEffect(() => {
    setApplications(initialApplications)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function createApplication() {
    if (!jobTitle || !company) return
    setSaving(true)
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company }),
      })
      const data: ApplicationCard = await res.json()
      addApplication(data)
      setOpen(false)
      setJobTitle("")
      setCompany("")
      toast.success(t("create_success"))
    } catch {
      toast.error(t("create_error"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> {t("add_button")}
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("dialog_title")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">{t("job_title_label")}</Label>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={t("job_title_placeholder")} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">{t("company_label")}</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t("company_placeholder")} className="mt-1" />
              </div>
              <Button className="w-full" onClick={createApplication} disabled={saving || !jobTitle || !company}>
                {t("add")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-5 gap-4 overflow-x-auto min-w-[800px]">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            label={t(col.labelKey as Parameters<typeof t>[0])}
            color={
              col.id === "WISHLIST" ? "bg-gray-100" :
              col.id === "APPLIED" ? "bg-blue-50" :
              col.id === "INTERVIEW" ? "bg-yellow-50" :
              col.id === "OFFER" ? "bg-green-50" : "bg-red-50"
            }
            applications={applications.filter((a) => a.status === col.id)}
          />
        ))}
      </div>
    </div>
  )
}
