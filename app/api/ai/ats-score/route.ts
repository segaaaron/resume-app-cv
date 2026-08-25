import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"
import { AI_INPUT_LIMITS, type ATSScoreResult } from "@/lib/services/ai/shared/ai-types"

const schema = z
  .object({
    jobDescription: z.string().max(AI_INPUT_LIMITS.jobDescription).optional(),
    roleTitle: z.string().max(120).optional(),
    sectionData: z.record(z.string(), z.unknown()).optional(),
    language: z.enum(["es", "en"]).optional(),
    templateId: z.string().max(64).optional(),

    resumeId: z.string().max(64).optional(),
    // Echoed back from a previous run over the SAME posting so the extraction is
    // not re-sampled (see ATSScoreInput.cachedKeywords). Bounded and validated
    // like any other input — a client sending nonsense only skews its own score.
    cachedKeywords: z
      .object({
        hardSkills: z.array(z.string().max(80)).max(40),
        softSkills: z.array(z.string().max(80)).max(40),
        jobTitle: z.string().max(120),
        mustHaves: z.array(z.string().max(160)).max(40),
        summary: z.string().max(600).optional(),
        // Los pesos NO se aceptan acá a propósito: esta petición trae el texto
        // del aviso, así que el servidor los MIDE de nuevo —es determinista y no
        // cuesta un token—. Aceptarlos sería dejar que el cliente decida cuánto
        // pesa cada término de su propio puntaje. En `ats-rescore` sí viajan,
        // porque ahí no hay aviso que medir.
      })
      .optional(),
  })
  .refine(
    (d) => (d.jobDescription?.trim().length ?? 0) >= 20 || (d.roleTitle?.trim().length ?? 0) >= 3,
    { message: "Provide a job description (20+ chars) or a role title (3+ chars)" },
  )

export async function POST(req: Request) {
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  try {
    /**
     * DOS ACTOS, UNA PETICIÓN, UNA CUOTA.
     *
     * La crítica del reclutador corre después de la medición porque necesita el
     * puntaje para anclar su veredicto, y eso llevó la espera a 13-16 segundos.
     * El puntaje está listo en el primer tercio: hacerlo esperar al veredicto es
     * regalar diez segundos de pantalla quieta.
     *
     * Se responde NDJSON, una línea por acto. Es la MISMA petición: la cuota se
     * cobra una vez y no cambia nada para ningún plan — partir la entrega no
     * puede cambiar lo que se le cobra a nadie.
     *
     * ── POR QUÉ SE ESPERA AL PRIMER ACTO ANTES DE RESPONDER ─────────────────
     *
     * Apenas se manda el primer byte, el estado HTTP ya viajó y no se corrige.
     * Un 422 de «esto no es una vacante», un 429 de cuota o un 403 de plan
     * llegarían dentro de un 200, y el cliente —que hoy los lee por status—
     * mostraría un informe vacío en vez del aviso correcto.
     *
     * Todo eso ocurre ANTES del primer acto. Así que se espera a que el primer
     * acto exista y recién ahí se abre el stream: si algo falla antes, no se
     * envió nada y `handleError` responde con su código de siempre.
     */
    let entregarPrimerActo: (r: ATSScoreResult) => void = () => {}
    const primerActo = new Promise<ATSScoreResult>((resolve) => { entregarPrimerActo = resolve })

    const completo = aiService.atsScore(
      authResult.userId, parsed.data, authResult.user.plan,
      (parcial) => entregarPrimerActo(parcial),
    )
    // Sin esto, un fallo posterior al primer acto queda como rechazo sin dueño y
    // Node lo reporta como unhandled rejection. Se consume acá y se vuelve a leer
    // dentro del stream, donde sí hay a quién contárselo.
    const resultado = completo.then((r) => ({ ok: true as const, r }), (e) => ({ ok: false as const, e }))

    const primero = await Promise.race([
      primerActo.then((r) => ({ tipo: "acto1" as const, r })),
      resultado.then((x) => ({ tipo: "fin" as const, x })),
    ])
    // Falló antes de tener nada que mostrar: nada se envió, responde como siempre.
    let inicial: ATSScoreResult
    if (primero.tipo === "acto1") inicial = primero.r
    else if (primero.x.ok) {
      // Terminó entero antes de que el primer acto llegara a esta carrera: sigue
      // habiendo dos líneas, sólo que la primera ya trae el veredicto puesto.
      inicial = primero.x.r
    } else throw primero.x.e
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const enc = new TextEncoder()
        const escribir = (obj: unknown) => controller.enqueue(enc.encode(`${JSON.stringify(obj)}\n`))
        escribir({ act: 1, result: inicial })
        const fin = await resultado
        // La crítica falla cerrado dentro del módulo, así que un fallo acá es
        // otra cosa. Se dice en la línea: el cliente se queda con el primer acto
        // en vez de esperar para siempre un segundo que no llega.
        if (fin.ok) escribir({ act: 2, result: fin.r })
        else escribir({ act: 0, error: fin.e instanceof Error ? fin.e.message : "ai_error" })
        controller.close()
      },
    })
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        // Sin esto un proxy junta los dos actos y los entrega juntos: el
        // streaming existiría en el servidor y no en la pantalla.
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (err) {
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email, payload: parsed.data })
  }
}
