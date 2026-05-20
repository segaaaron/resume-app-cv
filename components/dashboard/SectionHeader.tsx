import { Plus, Loader2 } from "lucide-react"
import type { ReactNode } from "react"

interface SectionHeaderProps {
  title: string
  count: number
  onNew: () => void
  newLabel: string
  creating: boolean
  children?: ReactNode
}

export default function SectionHeader({
  title,
  count,
  onNew,
  newLabel,
  creating,
  children,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div className="flex items-center gap-3">
        <h1
          className="font-playfair font-bold text-2xl sm:text-3xl"
          style={{ color: "var(--dash-navy)" }}
        >
          {title}
        </h1>
        <span
          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: "var(--dash-cyan)", color: "var(--dash-navy)" }}
        >
          {count}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {children}
        <button
          type="button"
          onClick={onNew}
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--dash-navy)" }}
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--dash-cyan)" }} />
          ) : (
            <Plus className="h-4 w-4" style={{ color: "var(--dash-cyan)" }} />
          )}
          {newLabel}
        </button>
      </div>
    </div>
  )
}
