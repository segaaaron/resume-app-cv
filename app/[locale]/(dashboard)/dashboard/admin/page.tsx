import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import AdminUsersTable from "@/components/admin/AdminUsersTable"

export const metadata = { title: "Admin — Users", robots: { index: false, follow: false } }

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect(`/${locale}/dashboard/resumes`)
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:                 true,
      name:               true,
      email:              true,
      plan:               true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      planInterval:       true,
      role:               true,
      stripeCustomerId:   true,
      createdAt:          true,
      lastActiveAt:       true,
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin — Usuarios</h1>
        <p className="text-muted-foreground text-sm mt-1">{users.length} usuarios registrados</p>
      </div>
      <AdminUsersTable users={users} />
    </div>
  )
}
