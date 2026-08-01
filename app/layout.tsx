import type { Metadata } from "next"
import {
  Plus_Jakarta_Sans, Playfair_Display,
  Space_Grotesk, Cormorant_Garamond, Archivo, DM_Serif_Display, Instrument_Serif,
  Merriweather, Lato, Source_Sans_3, IBM_Plex_Sans, Work_Sans,
  EB_Garamond, PT_Serif, Karla, Libre_Franklin, Nunito_Sans, Roboto_Slab, Cabin, Figtree, Spectral, Asap,
} from "next/font/google"
import { GeistSans } from "geist/font/sans"
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

// Design fonts for the premium template set — self-hosted by next/font (no CDN
// at render time, so the PDF microservice always has them). Each maps to the
// exact typeface the template was designed with.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap",
})
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], display: "swap",
})
const archivo = Archivo({
  variable: "--font-archivo", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap",
})
const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif", subsets: ["latin"], weight: ["400"], style: ["normal", "italic"], display: "swap",
})
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument", subsets: ["latin"], weight: ["400"], style: ["normal", "italic"], display: "swap",
})
// ATS template set fonts (Meridian/Verdant/Cardinal/Cobalt/Slate/…).
const merriweather = Merriweather({
  variable: "--font-merriweather", subsets: ["latin"], weight: ["400", "700"], display: "swap",
})
const lato = Lato({
  variable: "--font-lato", subsets: ["latin"], weight: ["300", "400", "700", "900"], display: "swap",
})
const sourceSans = Source_Sans_3({
  variable: "--font-source-sans", subsets: ["latin"], weight: ["400", "600", "700"], display: "swap",
})
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap",
})
const workSans = Work_Sans({
  variable: "--font-work-sans", subsets: ["latin"], weight: ["400", "600", "700"], display: "swap",
})
const ebGaramond = EB_Garamond({ variable: "--font-eb-garamond", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap" })
const ptSerif = PT_Serif({ variable: "--font-pt-serif", subsets: ["latin"], weight: ["400", "700"], display: "swap" })
const karla = Karla({ variable: "--font-karla", subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" })
const libreFranklin = Libre_Franklin({ variable: "--font-libre-franklin", subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" })
const nunitoSans = Nunito_Sans({ variable: "--font-nunito-sans", subsets: ["latin"], weight: ["400", "700", "800", "900"], display: "swap" })
const robotoSlab = Roboto_Slab({ variable: "--font-roboto-slab", subsets: ["latin"], weight: ["400", "700"], display: "swap" })
const cabin = Cabin({ variable: "--font-cabin", subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" })
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], weight: ["400", "500", "700", "800"], display: "swap" })
const spectral = Spectral({ variable: "--font-spectral", subsets: ["latin"], weight: ["400", "600"], display: "swap" })
const asap = Asap({ variable: "--font-asap", subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" })

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
      className={`${plusJakartaSans.variable} ${playfairDisplay.variable} ${spaceGrotesk.variable} ${cormorant.variable} ${archivo.variable} ${dmSerif.variable} ${instrumentSerif.variable} ${merriweather.variable} ${lato.variable} ${sourceSans.variable} ${plexSans.variable} ${workSans.variable} ${ebGaramond.variable} ${ptSerif.variable} ${karla.variable} ${libreFranklin.variable} ${nunitoSans.variable} ${robotoSlab.variable} ${cabin.variable} ${figtree.variable} ${spectral.variable} ${asap.variable} ${GeistSans.variable} h-full antialiased`}
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
