"use client"
import CoverLetterBase, { LETTER_VARIANTS } from "./CoverLetterBase"
import type { TemplateProps } from "./types"

export default function LtrCardinal(props: TemplateProps) {
  return <CoverLetterBase {...props} variant={LETTER_VARIANTS.cardinal} />
}
