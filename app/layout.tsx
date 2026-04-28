import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import SessionProvider from "@/components/providers/SessionProvider"
import { auth } from "@/lib/auth"

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
})

const BASE_URL = "https://readycv.app"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "READY CV — Crear CV Profesional Online Gratis",
    template: "%s | READY CV",
  },
  description:
    "Crea tu currículum vitae profesional online en minutos. Elige entre 29 plantillas modernas, completa tus datos y descarga tu CV en PDF. ¡Gratis para siempre!",
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
      className={`${plusJakartaSans.variable} h-full antialiased`}
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
