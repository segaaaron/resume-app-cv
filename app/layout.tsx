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
  keywords: [
    "crear cv profesional online",
    "hacer curriculum vitae gratis",
    "resume builder",
    "cv online profesional",
    "plantillas de curriculum",
    "crear cv gratis",
    "generador de cv",
    "cv para trabajo",
    "curriculum vitae",
    "CV online",
    "hacer cv",
    "plantillas cv profesionales",
  ],
  authors: [{ name: "READY CV", url: BASE_URL }],
  creator: "READY CV",
  publisher: "READY CV",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: BASE_URL,
    siteName: "READY CV",
    title: "READY CV — Crear CV Profesional Online Gratis",
    description:
      "Crea tu currículum vitae profesional online en minutos. 29 plantillas modernas, descarga en PDF. ¡Gratis!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "READY CV — Generador de CV Profesional Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "READY CV — Crear CV Profesional Online Gratis",
    description:
      "Crea tu currículum vitae profesional online en minutos. 29 plantillas modernas, descarga en PDF. ¡Gratis!",
    images: ["/og-image.png"],
    creator: "@readycv",
    site: "@readycv",
  },
  verification: {
    google: "google-site-verification-placeholder",
  },
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
