import type { Metadata } from "next"
import localFont from "next/font/local"
import { GeistSans } from "geist/font/sans"
import "./fonts.css"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import SessionProvider from "@/components/providers/SessionProvider"
import UmamiScript from "@/components/analytics/UmamiScript"
import ClientErrorReporter from "@/components/ClientErrorReporter"

// Figtree local: a ciertas IPs (la del VPS) Google le sirve Figtree como
// `fonts.gstatic.com/l/font?kit=…&skey=…`, y el `&` rompe next/font/google en
// Turbopack («queries have exactly one entry»). Archivo variable, subset latin.
const figtree = localFont({ variable: "--font-figtree", src: "../public/fonts/figtree-latin.woff2", weight: "400 800", display: "swap" })

const BASE_URL = "https://www.valhallaresume.com"

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
    default: "Valhalla Resume — AI Resume Builder | Beat ATS, 132 Templates",
    template: "%s | Valhalla Resume",
  },
  description:
    "Build an ATS-optimized resume with AI in minutes. 132 professional templates, cover letter generator, job application tracker. From $15/month.",
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
      className={`${figtree.variable} ${GeistSans.variable} h-full antialiased`}
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
