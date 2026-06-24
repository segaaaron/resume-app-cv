"use client"

/**
 * CTA on the (statically rendered) template detail page.
 *
 * The page is prerendered, so it can't know the session server-side. This
 * client button reads the session and routes accordingly:
 *   - logged in  → dashboard (create a CV there)
 *   - guest      → login (which offers account creation)
 *
 * Plan/PRO is enforced later at the create/download gate — the preview stays
 * open to everyone so visitors can see the template before committing.
 */

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  locale: string
  label: string
}

export default function TemplateUseButton({ locale, label }: Props) {
  const { data: session } = useSession()
  const router = useRouter()

  function handleClick() {
    router.push(session?.user ? `/${locale}/dashboard/resumes` : `/${locale}/login`)
  }

  return (
    <Button
      size="lg"
      onClick={handleClick}
      className="gap-2 text-base font-semibold bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-[#0a1322] shadow-[0_10px_40px_-10px_rgba(0,212,255,0.6)] hover:shadow-[0_15px_50px_-10px_rgba(0,212,255,0.8)] transition-all px-8"
    >
      {label} <ArrowRight className="h-4 w-4" />
    </Button>
  )
}
