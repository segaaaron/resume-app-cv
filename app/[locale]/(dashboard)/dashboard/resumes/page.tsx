import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasStripeBillingPortal } from "@/lib/plans"
import ResumesDashboard from "@/components/dashboard/ResumesDashboard"
import CheckoutReconciler from "@/components/dashboard/CheckoutReconciler"

export const dynamic = "force-dynamic"

export default async function ResumesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  type ResumeRow = { id: string; title: string; templateId: string; colorScheme: string; thumbnailUrl: string | null; updatedAt: Date; createdAt: Date; translatedFromId: string | null }
  let resumes: ResumeRow[] = []
  try {
    resumes = await db.resume.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        templateId: true,
        colorScheme: true,
        thumbnailUrl: true,
        updatedAt: true,
        createdAt: true,
        translatedFromId: true,
      },
    })
  } catch {
    redirect(`/${locale}/login`)
  }

  // The "manage plan" action opens Stripe's hosted portal, which needs a
  // stripeCustomerId. The session token carries none, and a PRO row can lack one (plan
  // granted outside checkout) — the button then 400s and shows an error toast.
  const billing = await db.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true, stripeCustomerId: true, paymentProvider: true },
  })
  // PayPal payers have no Stripe customer and no hosted portal at all — they cancel
  // from Settings, so the portal action is not theirs either.
  const canManageBilling =
    billing?.paymentProvider !== "PAYPAL"
    && hasStripeBillingPortal(billing?.subscriptionStatus, billing?.stripeCustomerId)

  return (
    <>
      {/* Activates the plan on return from Stripe Checkout if the webhook is delayed. */}
      <Suspense fallback={null}>
        <CheckoutReconciler />
      </Suspense>
      <ResumesDashboard initialResumes={resumes} canManageBilling={canManageBilling} />
    </>
  )
}
