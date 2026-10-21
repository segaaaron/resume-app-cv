// lib/services/ai/shared/clean-output.ts
//
// Nothing the AI writes reaches the user misspelled.
//
// The product ships a spell-checker that runs over the CV — and the CV contains
// text this product generated. Handing someone a rewritten bullet and then
// flagging a typo in it, in our own words, is the sort of thing that makes an
// assistant feel unreliable. So generated text is checked before it is returned.
//
// Safe to fix silently, unlike the user's own writing: this is OUR output, the
// user never typed it, and there is nothing of theirs to preserve. The card that
// checks the user's CV still only ever SUGGESTS.
//
// Deterministic and local — the same Hunspell dictionaries the card uses. No
// model, no network, no cost.

import { stripSectionLabel } from "@/lib/ats/strip-label"

/**
 * LO ÚNICO QUE SE LE SACA AL TEXTO GENERADO: LA ETIQUETA DE SECCIÓN.
 *
 * ── EL CORRECTOR SE FUE (CEO, 2026-10-20) ──────────────────────────────────
 * Acá corría Hunspell (`checkSpelling`) sobre TODO lo que el modelo escribía.
 * La regla del CEO ya lo había prohibido en el ATS por corregir mal —el caso
 * medido fue «moviles» → «mociles»— y seguía vivo en los otros cinco módulos:
 * una corrección equivocada entraba al CV sin que nadie la viera. Si el modelo
 * escribe una palabra, esa palabra es la que se entrega.
 *
 * @param texts  las cadenas generadas, en orden
 * @returns las mismas, sin la etiqueta de sección que el modelo a veces antepone
 */
export async function cleanGeneratedText(texts: string[]): Promise<string[]> {
  // El NOMBRE de una sección no es parte de su contenido. El modelo cita la
  // sección que está arreglando ("Professional Summary: …") y, aplicado tal
  // cual, eso se imprimía dentro del CV bajo un encabezado que ya decía PERFIL.
  return texts.map((t) => (t?.trim() ? stripSectionLabel(t) : t))
}
