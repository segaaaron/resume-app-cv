import { ReactNode } from "react"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import ReadingProgress from "./ReadingProgress"

type Props = {
  children: ReactNode
}

/**
 * Premium blog article wrapper — provides Navbar + Footer + full-height layout.
 * Children control inner layout (hero + body + CTA).
 * Print-safe: print:bg-white print:text-black handled by globals.
 */
export default function BlogArticle({ children }: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ReadingProgress />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
