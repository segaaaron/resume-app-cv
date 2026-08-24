import BrandMark from "@/components/shared/BrandMark"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="p-4 border-b border-border bg-white">
        <BrandMark href="/" tone="light" size="md" />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  )
}
