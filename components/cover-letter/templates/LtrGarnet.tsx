"use client"
import CoverLetterBase, { LETTER_VARIANTS } from "./CoverLetterBase"
import type { TemplateProps } from "./types"

export default function LtrGarnet(props: TemplateProps) {
  return <CoverLetterBase {...props} variant={LETTER_VARIANTS.garnet} />
}
