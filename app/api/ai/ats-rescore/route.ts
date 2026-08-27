// POST /api/ai/ats-rescore
// Deterministic ATS re-score — NO LLM, NO quota. Reuses the keywords a prior
// /api/ai/ats-score already extracted, so the score moves the instant the user
// applies a fix, without spending another AI call or hitting the cooldown.
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"
import { canUseAdvancedAts } from "@/lib/plans"

const schema = z.object({
  /** Scopes any cached answer to the résumé it came from. */
  resumeId: z.string().max(64).optional(),
  keywords: z.object({
    hardSkills: z.array(z.string().max(120)).max(60),
    softSkills: z.array(z.string().max(120)).max(60),
    jobTitle: z.string().max(200),
    mustHaves: z.array(z.string().max(200)).max(60),
    /**
     * Los pesos que el análisis midió sobre el aviso.
     *
     * Sin declararlos acá Zod los DESCARTA —no falla, los borra en silencio— y
     * este re-cálculo puntuaría sin ponderar mientras el análisis ponderó: el
     * número saltaría en la primera tecla, que es exactamente el defecto que el
     * carry-over de `semanticMatches` existe para evitar.
     */
    hardWeights: z.record(z.string().max(120), z.number().min(0).max(3)).optional(),
  }),
  sectionData: z.record(z.string(), z.unknown()).optional(),
  language: z.enum(["es", "en"]).optional(),
  templateId: z.string().max(64).optional(),
  // Echoed from the full analysis so the instant re-score credits the same
  // synonym matches instead of silently scoring exact-match only.
  semanticMatches: z.array(z.string().max(120)).max(80).optional(),
  demonstratedSoftSkills: z.array(z.string().max(120)).max(40).optional(),
  // The merge proposals the full analysis published, echoed for the same reason:
  // finding them costs an embedding call and this route makes none. Bounded like
  // everything else that crosses this boundary — the indexes are positions in a
  // role's bullet list, and the score is a cosine.
  mergePairs: z.array(z.object({
    targetId: z.string().max(64),
    indexes: z.tuple([z.number().int().min(0).max(200), z.number().int().min(0).max(200)]),
    // EL TEXTO DEL PAR TIENE QUE CRUZAR ESTE BORDE O EL ARREGLO NO EXISTE.
    // Zod descarta en silencio lo que no declara: sin esta línea el par llegaría
    // al recálculo con el índice pelado y volvería a señalar la línea equivocada
    // en cuanto el usuario aplique algo. El tope es holgado y `.catch` degrada un
    // texto imposible al comportamiento viejo en vez de tumbar el recálculo
    // entero con un 422 — un par perdido es una tarjeta menos, un 422 es el panel.
    texts: z.tuple([z.string().max(2000), z.string().max(2000)]).optional().catch(undefined),
    score: z.number().min(0).max(1),
  })).max(40).optional(),
  // Ídem las repeticiones: mismo embebido, mismo acarreo, mismos límites. Un
  // par vive entre DOS puestos, así que cada lado trae el suyo.
  repeatedPairs: z.array(z.object({
    // Cada lado con su texto, por lo mismo que arriba.
    a: z.object({ targetId: z.string().max(64), index: z.number().int().min(0).max(200), text: z.string().max(2000).optional().catch(undefined) }),
    b: z.object({ targetId: z.string().max(64), index: z.number().int().min(0).max(200), text: z.string().max(2000).optional().catch(undefined) }),
    score: z.number().min(0).max(1),
  })).max(40).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult
  // Advanced ATS is PRO/LIMITED only. `pro: true` (isActive) also passes
  // BASIC/SPRINT; this quota-less route must gate them out explicitly.
  if (!canUseAdvancedAts(authResult.user.plan)) {
    return apiError(403, "feature_pro_only", { req })
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  /**
   * UN PAR SIN SU TEXTO NO ENTRA. Falla cerrado, y a propósito.
   *
   * El tipo `SemanticPair` exige el texto porque un par identificado sólo por su
   * posición vuelve a señalar la línea equivocada en cuanto el usuario aplica
   * algo. Acá llega de un cliente, así que el tipo no alcanza: el esquema lo
   * acepta ausente —un navegador con el bundle viejo, una pestaña abierta desde
   * antes del deploy— y ES ACÁ donde se descarta.
   *
   * Lo que se pierde es una tarjeta de fusión hasta el próximo análisis completo.
   * Lo que se evita es ofrecer fusionar dos líneas que nadie emparejó.
   */
  const entrada = {
    ...parsed.data,
    mergePairs: parsed.data.mergePairs?.filter((p): p is typeof p & { texts: [string, string] } => !!p.texts),
    repeatedPairs: parsed.data.repeatedPairs?.filter(
      (p): p is typeof p & { a: typeof p.a & { text: string }; b: typeof p.b & { text: string } } => !!p.a.text && !!p.b.text,
    ),
  }

  try {
    const result = aiService.atsRescore(entrada)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email, payload: entrada })
  }
}
