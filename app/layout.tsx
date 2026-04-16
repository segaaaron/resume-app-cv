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

export const metadata: Metadata = {
  title: "CVV Pro — Crea tu CV profesional",
  description: "Construye un currículum profesional en minutos. Elige una plantilla, completa tus datos y descarga tu CV en PDF.",
  keywords: ["curriculum vitae", "CV", "resume", "plantillas CV", "crear CV online"],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="es" className={`${plusJakartaSans.variable} h-full antialiased`} style={{ fontFamily: "var(--font-jakarta), sans-serif" }}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionProvider session={session}>
          {children}
          <Toaster position="bottom-right" />
        </SessionProvider>
      </body>
    </html>
  )
}
