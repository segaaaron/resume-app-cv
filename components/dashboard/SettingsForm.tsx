"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { User, Mail, Calendar, Crown } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface UserData {
  id: string
  name: string | null
  email: string
  image: string | null
  plan: string
  createdAt: Date
}

export default function SettingsForm({ user }: { user: UserData }) {
  const [name, setName] = useState(user.name ?? "")
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        toast.success("Perfil actualizado")
      } else {
        toast.error("Error al guardar")
      }
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const planLabel = user.plan === "PRO" ? "Pro" : user.plan === "TRIAL" ? "Trial" : "Gratis"
  const planColor = user.plan === "PRO" ? "bg-amber-100 text-amber-700" : user.plan === "TRIAL" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="border border-border rounded-xl p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Perfil
        </h2>

        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-lg">
              {user.name?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name ?? "Sin nombre"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Separator />

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Correo electrónico</Label>
            <div className="flex items-center gap-2">
              <Input value={user.email} disabled className="bg-muted" />
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground">El correo no puede cambiarse</p>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </div>

      {/* Account Info */}
      <div className="border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Crown className="h-4 w-4" />
          Plan y cuenta
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Plan actual</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user.plan === "FREE" ? "Acceso a funcionalidades básicas" : user.plan === "TRIAL" ? "Prueba de 7 días activa" : "Acceso completo a todas las funcionalidades"}
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${planColor}`}>{planLabel}</span>
        </div>

        {user.plan !== "PRO" && (
          <Button variant="outline" size="sm" onClick={() => window.location.href = "/pricing"} className="gap-2">
            <Crown className="h-3.5 w-3.5" />
            Mejorar a Pro
          </Button>
        )}

        <Separator />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Miembro desde {format(new Date(user.createdAt), "MMMM yyyy", { locale: es })}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-destructive/30 rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-destructive">Zona de peligro</h2>
        <p className="text-sm text-muted-foreground">
          Una vez eliminada tu cuenta, todos tus datos serán borrados permanentemente y no podrán recuperarse.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive/50 text-destructive hover:bg-destructive/5"
          onClick={() => toast.error("Por favor contacta soporte para eliminar tu cuenta")}
        >
          Eliminar cuenta
        </Button>
      </div>
    </div>
  )
}
