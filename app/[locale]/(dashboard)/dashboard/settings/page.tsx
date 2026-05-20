import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import SettingsForm from "@/components/dashboard/SettingsForm"

export const dynamic = "force-dynamic"

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, plan: true, subscriptionStatus: true, subscriptionEndsAt: true, planInterval: true, createdAt: true },
  })

  if (!user) redirect(`/${locale}/login`)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Page head */}
      <div className="dash-card-in" style={{ animationDelay: "0ms", marginBottom: 28 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          color: "#00D4FF", marginBottom: 6,
          display: "flex", alignItems: "center", gap: 7,
        }}>
          <span style={{ width: 14, height: 1.5, background: "#00D4FF", opacity: 0.5, display: "inline-block" }} />
          Cuenta
        </div>
        <h1 style={{
          fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)",
          fontSize: 32, fontWeight: 700, color: "#1a2e4a",
          letterSpacing: "-0.035em", lineHeight: 1.1, margin: 0,
        }}>
          Configuración
        </h1>
        <p style={{ fontSize: 13.5, color: "#6B7A8C", marginTop: 6 }}>
          Gestiona tu perfil y preferencias de cuenta
        </p>
      </div>
      <div className="dash-card-in" style={{ animationDelay: "80ms" }}>
        <SettingsForm user={user} />
      </div>
    </div>
  )
}
