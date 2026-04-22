import Link from "next/link"
import { FileText } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="p-4 border-b border-border bg-white">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary w-fit">
          <FileText className="h-5 w-5" />
          READY CV
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  )
}
