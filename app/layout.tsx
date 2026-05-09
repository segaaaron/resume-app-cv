import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import SessionProvider from "@/components/providers/SessionProvider"
import { auth } from "@/lib/auth"

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
})

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
})

const BASE_URL = "https://readycvv.com"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "ReadyCV — AI Resume Builder | Beat ATS, 111+ Templates",
    template: "%s | ReadyCV",
  },
  description:
    "Build an ATS-optimized resume with AI in minutes. 111+ professional templates, cover letter generator, job application tracker. From $15/month.",
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
  const session = await auth()

  return (
    <html
      lang={locale}
      className={`${plusJakartaSans.variable} ${playfairDisplay.variable} h-full antialiased`}
      style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <SessionProvider session={session}>
          {children}
          <Toaster position="top-center" />
        </SessionProvider>
      </body>
    </html>
  )
}
