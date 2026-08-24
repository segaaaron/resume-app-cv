"use client"

// A month-and-year field: type it, or pick it.
//
// Three controls were tried before this one and each failed for a documented
// reason. Two dropdowns is the pattern the research ranks worst — slow, tiny tap
// targets, and a year list decades long. A plain text field is error-proof but
// gives a mouse user nothing to click. The browser's own `type="month"` looks
// different in every browser and does not exist at all in Safari or Firefox.
//
// So: our own panel. Months in a grid, a year the user steps through, and the
// text stays the source of truth — "09/2010" typed shows September 2010 already
// selected, and picking September 2010 writes "09/2010" back.
//
// No day, ever. A résumé date is month + year: an ATS reads it to work out
// tenure, and nobody writes "15 April 2025" as a graduation date.

import { useId, useState } from "react"
import { Popover } from "@base-ui/react/popover"
import { useTranslations } from "next-intl"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Z_POPOVER_OVER_BAR } from "@/lib/ui/z-layers"

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const
const MIN_YEAR = 1960
const MAX_YEAR = new Date().getFullYear() + 8

/**
 * Reads MM/YYYY, and also the YYYY-MM the editor used to store.
 *
 * MM/YYYY is the canonical shape — `lib/ats/normalize-dates.ts` says so in its
 * first line, and templates print the stored string straight into the PDF. The
 * old pickers wrote YYYY-MM, so every CV in the database carries dates in that
 * form; refusing to read them would blank out dates people had already entered.
 * Read both, write one.
 */
export function parse(value: string): { mm: string | null; yyyy: number | null } {
  const canonical = /^(0[1-9]|1[0-2])\/((?:19|20)\d{2})$/.exec(value)
  if (canonical) return { mm: canonical[1], yyyy: Number(canonical[2]) }
  const legacy = /^((?:19|20)\d{2})-(0[1-9]|1[0-2])$/.exec(value)
  if (legacy) return { mm: legacy[2], yyyy: Number(legacy[1]) }
  // A bare year, which real CVs in the database are full of. Not the canonical
  // shape, but a legitimate résumé date and absolutely not an error to shout at
  // someone about — the picker opens on that year so adding the month is one
  // click, and until they do, their data is left exactly as they typed it.
  const yearOnly = /^((?:19|20)\d{2})$/.exec(value)
  if (yearOnly) return { mm: null, yyyy: Number(yearOnly[1]) }
  return { mm: null, yyyy: null }
}

/** Recognised shapes. Anything else typed is what the error message is for. */
export function isRecognised(value: string): boolean {
  const { yyyy } = parse(value)
  return yyyy !== null
}

/** What the user sees: a legacy value is shown canonical without rewriting it. */
export function display(value: string): string {
  const { mm, yyyy } = parse(value)
  return mm && yyyy ? `${mm}/${yyyy}` : value
}



interface Props {
  /** Optional: one is generated when the caller has no id to give. */
  id?: string
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  /** Shown beside the label, the way every other field in the editor does. */
  icon?: LucideIcon
  /**
   * Which of the app's two field looks to wear. The editor's Content tab has
   * its own — 11px steel-blue label with an icon, 36px input — and a date field
   * that ignored it stood out as the one control that came from somewhere else.
   */
  variant?: "panel" | "form"
}

export default function MonthYearField({
  id: givenId, label, value, onChange, disabled = false, icon: Icon, variant = "panel",
}: Props) {
  const autoId = useId()
  const id = givenId ?? autoId
  const t = useTranslations("editor.ai_profile_fill.interview")
  const [touched, setTouched] = useState(false)
  const [open, setOpen] = useState(false)

  const { mm, yyyy } = parse(value)
  // The panel opens on the year already in the field; failing that, on today.
  const [viewYear, setViewYear] = useState<number>(yyyy ?? new Date().getFullYear())

  // Invalid means "I cannot read this", not "this is not month-and-year". A CV
  // carrying "2015" is not a mistake to flag red the first time the field is
  // touched.
  const invalid = touched && value.length > 0 && !isRecognised(value)

  /** Types the slash for the user, and refuses anything that is not a digit. */
  function handleTyped(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 6)
    onChange(digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`)
  }

  function pick(month: string) {
    onChange(`${month}/${viewYear}`)
    setTouched(true)
    setOpen(false)
  }

  function openPanel(next: boolean) {
    // Re-anchor on the value each time, so reopening after typing a new year
    // does not show the year from last time.
    if (next) setViewYear(yyyy ?? new Date().getFullYear())
    setOpen(next)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {variant === "form" ? (
        <label
          htmlFor={id}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 600, color: "#7A9BB5",
            letterSpacing: "0.01em", textTransform: "capitalize",
          }}
        >
          {Icon && <Icon size={12} strokeWidth={2} style={{ color: "#5B8FBD", flexShrink: 0 }} />}
          {label}
        </label>
      ) : (
        <Label htmlFor={id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {Icon && <Icon className="size-3" aria-hidden />}
          {label}
        </Label>
      )}

      <div className="relative">
        <Input
          id={id}
          value={display(value)}
          onChange={(e) => handleTyped(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          placeholder={t("ph_mm_yyyy")}
          inputMode="numeric"
          maxLength={7}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-err` : undefined}
          className={cn(
            "tabular-nums",
            variant === "form"
              ? "pf-input h-9 pr-9 pl-3 text-sm text-[#1a2e4a]"
              : "h-10 pr-9 text-[12.5px]",
          )}
        />
        <Popover.Root open={open} onOpenChange={openPanel}>
          <Popover.Trigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label={t("pick_date")}
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              />
            }
          >
            <CalendarDays aria-hidden />
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Positioner side="bottom" align="end" sideOffset={6} style={{ zIndex: Z_POPOVER_OVER_BAR }}>
              <Popover.Popup className="w-[248px] rounded-xl border border-border bg-popover p-3 shadow-lg outline-none">
                {/* Year stepper. A dropdown of fifty years is what this replaces. */}
                <div className="mb-2.5 flex items-center justify-between">
                  <Button
                    type="button" variant="ghost" size="icon-sm"
                    aria-label={t("prev_year")}
                    disabled={viewYear <= MIN_YEAR}
                    onClick={() => setViewYear((y) => Math.max(MIN_YEAR, y - 1))}
                  >
                    <ChevronLeft aria-hidden />
                  </Button>
                  <span aria-live="polite" className="text-[13px] font-bold tabular-nums text-foreground">
                    {viewYear}
                  </span>
                  <Button
                    type="button" variant="ghost" size="icon-sm"
                    aria-label={t("next_year")}
                    disabled={viewYear >= MAX_YEAR}
                    onClick={() => setViewYear((y) => Math.min(MAX_YEAR, y + 1))}
                  >
                    <ChevronRight aria-hidden />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {MONTHS.map((m) => {
                    const selected = mm === m && yyyy === viewYear
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => pick(m)}
                        aria-pressed={selected}
                        className={cn(
                          "cursor-pointer rounded-lg px-1 py-2 text-[11.5px] font-medium transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {t(`mon_${m}`)}
                      </button>
                    )
                  })}
                </div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>

      {invalid && (
        // Announced, not just red: a border colour says nothing to a screen
        // reader, and nothing to anyone about how to fix it.
        <p id={`${id}-err`} role="alert" className="text-[10.5px] font-medium text-destructive">
          {t("date_invalid")}
        </p>
      )}
    </div>
  )
}
