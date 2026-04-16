import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import SettingsForm from "@/components/dashboard/SettingsForm"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, plan: true, createdAt: true },
  })

  if (!user) redirect("/login")

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona tu perfil y preferencias de cuenta</p>
      </div>
      <SettingsForm user={user} />
    </div>
  )
}
