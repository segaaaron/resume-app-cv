import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import SessionProvider from "@/components/providers/SessionProvider"
import UmamiScript from "@/components/analytics/UmamiScript"
import ClientErrorReporter from "@/components/ClientErrorReporter"

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
})

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
})

const BASE_URL = "https://readycvv.com"

// Umami analytics website id. This value is PUBLIC (it ships in every page's HTML),
// so a hardcoded fallback is safe. It is also necessary: Dokploy builds this app
// from the Dockerfile and does not reliably inline this NEXT_PUBLIC_* var at build
// time, so the env alone left analytics dark. The env still wins when it is present
// — set NEXT_PUBLIC_UMAMI_WEBSITE_ID in Dokploy's Build Args to override this.
const UMAMI_WEBSITE_ID =
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "84d805f1-2027-428d-bd64-cb53496daa9f"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "ReadyCVV — AI Resume Builder | Beat ATS, 143 Templates",
    template: "%s | ReadyCVV",
  },
  description:
    "Build an ATS-optimized resume with AI in minutes. 143 professional templates, cover letter generator, job application tracker. From $15/month.",
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params?: Promise<{ locale?: string }>
}) {
  const resolvedParams = await params?.catch?.(() => undefined)
  const locale = resolvedParams?.locale ?? "es"

  return (
    <html
      lang={locale}
      className={`${plusJakartaSans.variable} ${playfairDisplay.variable} h-full antialiased`}
      style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <ClientErrorReporter />
        <SessionProvider>
          {children}
          <Toaster position="top-center" />
        </SessionProvider>
        {UMAMI_WEBSITE_ID && <UmamiScript websiteId={UMAMI_WEBSITE_ID} />}
      </body>
    </html>
  )
}
