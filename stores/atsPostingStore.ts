import { create } from "zustand"

/**
 * LA VACANTE QUE SE ESTÁ TRABAJANDO, DISPONIBLE PARA TODO EL EDITOR.
 *
 * ── EL DEFECTO QUE ESTO CIERRA (reportado, 2026-08-22) ─────────────────────
 *
 *   «El asistente de IA escribe viñetas sin saber de la vacante... debería saber
 *    qué tipo de información generar, de alto impacto para el usuario.»
 *
 * El resultado del ATS vivía dentro de `useATSScore`, un hook que monta un solo
 * componente: el panel. Así que el asistente —que escribe viñetas y el resumen
 * que TERMINAN EN EL MISMO CV— no tenía forma de saber contra qué puesto se
 * estaba postulando el usuario. Escribía bien, pero al aire.
 *
 * Es la regla del CEO aplicada donde faltaba: «el ATS manda; todo lo que tenga
 * el ATS debe consultar al ATS, nada por separado».
 *
 * ── POR QUÉ UNA TIENDA PROPIA Y NO `resumeStore` ───────────────────────────
 *
 * `resumeStore` guarda el DOCUMENTO: lo que se persiste y se imprime. Esto es
 * estado de una sesión de análisis —vive mientras la pestaña esté abierta y no
 * se guarda en ninguna parte—. Mezclarlos haría que un dato de análisis viajara
 * dentro del CV en cualquier serialización futura.
 *
 * ── ALCANCE, QUE ES LA PARTE DELICADA ──────────────────────────────────────
 *
 * Lleva el `resumeId` con el que se analizó. Un CV distinto NO hereda la vacante
 * del anterior: escribirle viñetas apuntando a una oferta que no es la suya es
 * peor que no apuntar a ninguna. `termsFor(resumeId)` es la única lectura
 * pública justamente para que nadie pueda saltarse esa comprobación.
 */
interface AtsPostingState {
  /** Los términos que la vacante pide, tal como la vacante los escribe. */
  terms: string[]
  /** El cargo de la oferta, para que el asistente sepa a qué apunta. */
  jobTitle: string
  /** El CV sobre el que se corrió el análisis. */
  resumeId: string | null
  setPosting: (p: { terms: string[]; jobTitle: string; resumeId: string | null }) => void
  clear: () => void
  /** Los términos SÓLO si son de este CV. Devuelve `[]` en cualquier otro caso. */
  termsFor: (resumeId: string | null) => string[]
  /** El cargo de la oferta, con la misma comprobación de alcance. */
  jobTitleFor: (resumeId: string | null) => string
}

export const useAtsPostingStore = create<AtsPostingState>((set, get) => ({
  terms: [],
  jobTitle: "",
  resumeId: null,
  setPosting: ({ terms, jobTitle, resumeId }) => set({ terms, jobTitle, resumeId }),
  clear: () => set({ terms: [], jobTitle: "", resumeId: null }),
  termsFor: (resumeId) => {
    const st = get()
    if (!resumeId || st.resumeId !== resumeId) return []
    return st.terms
  },
  jobTitleFor: (resumeId) => {
    const st = get()
    if (!resumeId || st.resumeId !== resumeId) return ""
    return st.jobTitle
  },
}))
