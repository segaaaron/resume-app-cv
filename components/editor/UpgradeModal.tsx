"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Check, Zap, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface Props {
  open: boolean
  onClose: () => void
}

const features = [
  "CVs ilimitados",
  "29 plantillas profesionales",
  "Descarga en PDF",
  "Cartas de presentación",
  "Seguimiento de candidaturas",
  "Soporte prioritario",
]

export default function UpgradeModal({ open, onClose }: Props) {
  const t = useTranslations("editor.upgrade")
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null)
  const router = useRouter()
  const locale = useLocale()

  async function handleCheckout(plan: "monthly" | "annual") {
    setLoading(plan)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      if (res.status === 401) {
        router.push(`/${locale}/register?plan=${plan}`)
        return
      }

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Error al iniciar el pago")
        return
      }

      if (data.url) window.location.href = data.url
    } catch {
      toast.error(t("toast_connection_error"))
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Desbloquea todas las plantillas con Pro
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Accede a todas las plantillas, exporta en PDF y mucho más.
          </p>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-4 px-6 pb-6 pt-2">
          {/* Monthly */}
          <div className="border-2 border-border rounded-xl p-5 flex flex-col">
            <p className="text-sm font-medium text-muted-foreground mb-1">Mensual</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold">$15</span>
              <span className="text-muted-foreground text-sm">/ mes</span>
            </div>
            <ul className="space-y-1.5 mb-5 flex-1">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleCheckout("monthly")}
              disabled={!!loading}
            >
              {loading === "monthly" ? "Redirigiendo..." : "Empezar ahora"}
            </Button>
          </div>

          {/* Annual */}
          <div className="border-2 border-primary rounded-xl p-5 flex flex-col bg-primary/5 relative">
            <span className="absolute top-3 right-3 text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
              Ahorra 20%
            </span>
            <p className="text-sm font-medium text-primary mb-1">Anual</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold">$144</span>
              <span className="text-muted-foreground text-sm">/ año</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">$12/mes · ahorras $36</p>
            <ul className="space-y-1.5 mb-5 flex-1">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              onClick={() => handleCheckout("annual")}
              disabled={!!loading}
            >
              {loading === "annual" ? "Redirigiendo..." : "Mejor precio"}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Cancela en cualquier momento · Pago seguro con Stripe
        </p>
      </DialogContent>
    </Dialog>
  )
}
