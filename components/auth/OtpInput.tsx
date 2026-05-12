"use client"

import { useRef, KeyboardEvent, ClipboardEvent } from "react"
import { cn } from "@/lib/utils"

interface Props {
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  disabled?: boolean
}

export default function OtpInput({ value, onChange, autoFocus = false, disabled = false }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "")

  function handleChange(index: number, char: string) {
    const digit = char.replace(/\D/g, "").slice(-1)
    const next = digits.map((d, i) => (i === index ? digit : d)).join("")
    onChange(next)
    if (digit && index < 5) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = digits.map((d, i) => (i === index ? "" : d)).join("")
        onChange(next)
      } else if (index > 0) {
        refs.current[index - 1]?.focus()
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < 5) {
      refs.current[index + 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    onChange(pasted)
    const focusIdx = Math.min(pasted.length, 5)
    refs.current[focusIdx]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-border bg-background",
            "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            digit ? "border-primary/50" : "border-border"
          )}
        />
      ))}
    </div>
  )
}
