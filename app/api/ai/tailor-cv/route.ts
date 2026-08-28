import { NextResponse } from "next/server"
import { TAILOR_WORKLOAD_MAX } from "@/lib/ats/report"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"

/**
 * LA OFERTA CRUDA YA NO ENTRA.
 *
 * Entraban hasta 6.000 caracteres de vacante y tailor la volvía a interpretar por
 * su cuenta — un trabajo que `ats-score` ya había hecho, con su propio resultado
 * que después había que desempatar contra el primero. Ahora entra el trabajo YA
 * diagnosticado y los términos ya extraídos.
 *
 * Como efecto, la superficie de inyección de prompt se achica: lo que llega es
 * una lista de términos cortos y acotados, no el texto que escribió un tercero.
 * El `untrustedDataRule` del módulo se queda igual — esos términos SALIERON de la
 * oferta, así que siguen siendo dato ajeno.
 *
 * `reason` es un enum, no texto libre: el motivo lo decidió el informe y la guía
 * la escribe el módulo. Una cadena arbitraria del cliente terminaría dentro del
 * prompt.
 */
const schema = z.object({
  sectionData: z.record(z.string(), z.unknown()),
  language: z.enum(["es", "en"]).optional(),
  posting: z.object({
    jobTitle: z.string().max(120).default(""),
    hardSkills: z.array(z.string().max(80)).max(40).default([]),
    softSkills: z.array(z.string().max(80)).max(20).default([]),
    mustHaves: z.array(z.string().max(160)).max(20).default([]),
  }),
  // Acotado: el prompt crece con cada ítem, y el modelo escribe una línea por cada uno.
  workload: z.array(z.object({
    checkId: z.string().max(120),
    targetId: z.string().max(64),
    index: z.number().int().min(0).max(60),
    /**
     * La línea a reescribir. Declarada acá o Zod la borra en silencio y el
     * ejecutor vuelve a resolver por índice — que es de donde salía el «churn».
     * `.catch` degrada un texto imposible al comportamiento viejo en vez de
     * tumbar la petición entera con un 422.
     */
    text: z.string().max(2000).optional().catch(undefined),
    reason: z.enum(["no_metric", "weak_verb", "duplicate", "dilutes", "cliche", "orphan", "critical", "tailored"]),
  })).max(TAILOR_WORKLOAD_MAX),
  rewriteSummary: z.boolean().optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  try {
    const result = await aiService.tailorCV(authResult.userId, parsed.data, authResult.user.plan)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email, payload: parsed.data })
  }
}
