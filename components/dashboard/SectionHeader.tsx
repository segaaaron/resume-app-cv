import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          {title}
          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">
            {count}
          </span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {children}
        <Button onClick={onNew} disabled={creating} className="gap-2 flex-1 sm:flex-none">
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {newLabel}
        </Button>
      </div>
    </div>
  )
}
