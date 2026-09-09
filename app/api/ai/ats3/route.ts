// app/api/ai/ats3/route.ts
//
// EL ÚNICO BORDE DEL MOTOR v3.
//
// ── UNA PETICIÓN, UNA CUOTA, VARIOS ACTOS ───────────────────────────────────
// El puntaje está listo en milisegundos y la auditoría tarda segundos: hacer
// esperar al primero por la segunda es regalar pantalla quieta. Se responde
// NDJSON, una línea por acto.
//
// Partir la ENTREGA no puede cambiar lo que se le COBRA a un plan: sigue siendo
// una petición y una cuota.
//
// ── POR QUÉ EL STREAM SE ABRE TARDE ─────────────────────────────────────────
// Apenas se manda el primer byte, el estado HTTP ya viajó y no se corrige. Un
// 403 de plan, un 429 de cuota o un 422 de datos inválidos llegarían DENTRO de
// un 200 y el cliente mostraría un panel vacío en vez del aviso correcto. Todo
// lo que responde por código HTTP ocurre antes de abrir el stream.

import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { db } from "@/lib/db"
import type { Prisma } from "@prisma/client"
import { enforceAIQuota, refundDailyQuota } from "@/lib/services/ai/shared/quota-enforcer"
// El adaptador del proveedor: es el borde de la API, no lógica del ATS viejo.
// Escribir un segundo cliente duplicaría el manejo de reintentos, el modelo de
// respaldo y la normalización de parámetros que el modelo de razonamiento exige.
import { OpenAIClientAdapter } from "@/lib/services/ai/OpenAIClientAdapter"
// El modelo sale de su dueño, no de un literal acá: un id escrito en dos lados
// termina moviéndose en uno solo, y el modelo entra en TODAS las claves de
// caché — un desacuerdo serviría respuestas de otro oráculo como si fueran de
// éste. Es el de prosa porque estos prompts ESCRIBEN el CV.
import { AI_MODEL_PROSE, logAIUsage } from "@/lib/ai-client"
import { computeCostUsd } from "@/lib/services/ai/shared/cost-tracker"
import { AIAts3Module } from "@/lib/services/ai/modules/AIAts3Module"
import {
  buildTree,
  cacheKey,
  openLedger,
  runAnalysis,
  runRewrite,
  termsOf,
  type AtsStore,
  type CacheKind,
  type RawResume,
} from "@/lib/ats3/engine"
import { buildTermIndex, JobSpecSchema } from "@/lib/ats3/contracts"
import { ResolutionLogSchema, type Resolution } from "@/lib/ats3/contracts"

export const maxDuration = 120

/**
 * Topes de entrada.
 *
 * Un cuerpo sin techo es una puerta abierta: el costo de una llamada crece con
 * lo que entra, así que el límite vive acá, en el borde, y no en la confianza.
 */
const LIMITS = { jd: 20_000, bullet: 1_200, bullets: 120, roles: 30 } as const

const resumeSchema = z.object({
  summary: z.string().max(4_000).default(""),
  workExperience: z
    .array(
      z.object({
        jobTitle: z.string().max(160).default(""),
        employer: z.string().max(160).default(""),
        startDate: z.string().max(40).default(""),
        endDate: z.string().max(40).default(""),
        description: z.string().max(LIMITS.bullet * LIMITS.bullets).default(""),
      }),
    )
    .max(LIMITS.roles)
    .default([]),
  skills: z.array(z.object({ name: z.string().max(120) })).max(120).default([]),
})

/**
 * EL SEGUNDO CAMINO: reescribir UNA línea.
 *
 * Va por la MISMA ruta y no por una propia porque comparte todo lo que importa:
 * la cuota, los topes de entrada, el modelo y el caché. Dos rutas serían dos
 * lugares donde ajustar un tope, y el que se olvide da un 422 con la pantalla
 * congelada.
 *
 * La vacante ya parseada viaja de vuelta desde el cliente para no re-preguntarla
 * — es la misma respuesta que el análisis acaba de entregar y ya está guardada;
 * igual se VALIDA acá, porque un cliente que manda cualquier cosa sólo puede
 * arruinar su propio resultado si nadie mira.
 */
const rewriteSchema = z.object({
  action: z.literal("rewrite"),
  resumeId: z.string().max(64),
  nodeId: z.string().max(64),
  jobDescription: z.string().min(20).max(LIMITS.jd),
  language: z.enum(["es", "en"]).default("es"),
  resume: resumeSchema,
  spec: JobSpecSchema,
  /** Lo que la vacante exige y el CV ya demuestra: define dónde conviene gastar. */
  covered: z.array(z.string().max(80)).max(80).default([]),
  /**
   * Lo que la tarjeta prometió cerrar sobre esta línea.
   *
   * Va al prompt, así que se acota acá: es texto que el cliente elige y que
   * termina dentro de una petición al modelo. El tope es de presentación —se
   * recorta, no rechaza—: un foco largo no puede dejar al usuario sin
   * reescritura con la cuota ya gastada.
   */
  focus: z.string().max(400).optional().catch(undefined),
  /** La otra línea de una fusión. El motor la absorbe y la retira. */
  mergeWith: z.string().max(64).optional().catch(undefined),
  /** El puesto al que se agrega una línea NUEVA, con el tema en `focus`. */
  addToRole: z.string().max(64).optional().catch(undefined),
})

/**
 * EL TERCER CAMINO: decir que un hallazgo quedó resuelto.
 *
 * Sin esto, `loyalty` leía siempre un registro vacío y el motor volvía a
 * señalar lo que el usuario ya había arreglado en cuanto reanalizaba: el
 * "bucle infinito" que este motor existe para no tener, con la defensa escrita,
 * probada y desconectada.
 *
 * No llama al modelo y por eso NO gasta cuota: es una escritura y nada más.
 */
const resolveSchema = z.object({
  action: z.literal("resolve"),
  resumeId: z.string().max(64),
  jobDescription: z.string().min(20).max(LIMITS.jd),
  entries: z
    .array(
      z.object({
        findingId: z.string().max(64),
        nodeId: z.string().max(64),
        nodeHashAtResolution: z.string().max(64),
        resolvedBy: z.enum(["AI_SUGGESTION", "USER_EDIT", "DISMISSED"]),
        // Lo que la pantalla necesita para volver a dibujar «Hechas» después de
        // un F5. Se recortan, no rechazan: perder el registro por un título
        // largo sería peor que mostrarlo cortado.
        title: z.string().max(160).optional().catch(undefined),
        kind: z.enum(["applied", "dropped", "dismissed"]).optional().catch(undefined),
        before: z.string().max(600).optional().catch(undefined),
        after: z.string().max(600).optional().catch(undefined),
      }),
    )
    .min(1)
    .max(40),
})

const analyzeSchema = z.object({
  action: z.literal("analyze").optional(),
  resumeId: z.string().max(64),
  jobDescription: z.string().min(20).max(LIMITS.jd),
  language: z.enum(["es", "en"]).default("es"),
  resume: resumeSchema,
  /**
   * Verificaciones de lectura que el cliente haya medido sobre el documento
   * renderizado. `null` = no se pudo medir, y entonces sale del denominador en
   * vez de contar como fallada: castigar por algo que nadie miró es fabricar un
   * defecto.
   *
   * HOY NADIE LAS MANDA: el panel envía `{}` siempre, y el pilar de lectura se
   * calcula entero con `readableChecks`, que deriva de los datos estructurados y
   * no mira el PDF. Se dice acá porque el comentario anterior afirmaba que el
   * cliente «ya midió sobre el documento renderizado» y que su medición gana:
   * las dos frases describían un productor que no existe, y quien las leyera
   * daría por cubierta una comprobación que nadie hace.
   *
   * El campo se conserva porque la puerta es correcta —medir el PDF exportado
   * vale más que derivarlo— pero mientras no haya quien la cruce, esto es un
   * hueco declarado, no una defensa.
   */
})

const schema = z.union([rewriteSchema, resolveSchema, analyzeSchema])

/**
 * El almacenamiento del motor, sobre la tabla que ya existe.
 *
 * `AiAnswerCache` es genérica —qué pregunta, el hash de todo lo que la define, y
 * la respuesta— así que las cuatro capas del motor entran sin una migración. Va
 * con `resumeId` para que se borre junto con el CV: la respuesta cita las líneas
 * del candidato, y guardarla después de que borró el documento sería conservar
 * texto suyo que pidió eliminar.
 *
 * Falla ABIERTO en las dos direcciones: un caché roto puede costar una llamada,
 * nunca una petición.
 */
function makeStore(resumeId: string, model: string): AtsStore {
  return {
    async read(kind: CacheKind, hash: string) {
      try {
        const row = await db.aiAnswerCache.findUnique({
          where: { kind_inputHash: { kind, inputHash: hash } },
          select: { payload: true },
        })
        return row?.payload ?? null
      } catch {
        return null
      }
    },
    async write(kind: CacheKind, hash: string, payload: unknown) {
      const data = {
        payload: payload as Prisma.InputJsonValue,
        model,
        // La vacante no depende de ningún CV: dos candidatos que pegan el mismo
        // aviso comparten la respuesta, y por eso no cuelga de uno.
        resumeId: kind === "ats3-jd" ? null : resumeId,
      }
      try {
        /**
         * UPSERT, no create.
         *
         * Las cuatro capas de caché se direccionan por CONTENIDO: su payload no
         * cambia para la misma clave, así que reescribirlo es inocuo. El
         * registro de lo resuelto NO: crece con cada arreglo que el usuario
         * acepta, y con `create` la segunda escritura chocaba con la clave y se
         * perdía en silencio — la memoria que impide volver a señalar lo ya
         * arreglado no habría guardado nunca más de un hallazgo.
         */
        await db.aiAnswerCache.upsert({
          where: { kind_inputHash: { kind, inputHash: hash } },
          create: { kind, inputHash: hash, ...data },
          update: data,
        })
      } catch {
        // La base falló. Un caché roto cuesta una llamada, nunca una petición.
      }
    },
  }
}

export async function POST(req: Request) {
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  try {
    /**
     * EL CV TIENE QUE SER SUYO, Y ESO NO LO CONTESTA `requireUser`.
     *
     * `requireUser` autentica a la PERSONA; el `resumeId` llega en el cuerpo y
     * decide dos cosas que no son suyas: la clave del registro de resoluciones
     * (`cacheKey.log`) y la columna por la que se borra el caché cuando el CV se
     * elimina. Sin esta comprobación, quien conociera el id de otro —es un cuid,
     * y viaja en la URL del editor— podía escribir en su registro y silenciarle
     * hallazgos que sí le corresponden.
     *
     * Es el mismo `where` que usa `ResumeService` en cada camino que toca un CV:
     * el id NUNCA va solo. Una fila por clave primaria; el coste no se mide.
     *
     * VA DENTRO DEL `try`, y no es un detalle de estilo: `handleError` es lo que
     * escribe la falla en el panel de Service Errors —la directiva es que TODAS
     * se vean, 4xx incluidas—. Con la consulta afuera, una base caída lanzaba
     * fuera del handler y el 500 llegaba sin una línea en el panel.
     */
    const propio = await db.resume.findFirst({
      where: { id: parsed.data.resumeId, userId: authResult.userId },
      select: { id: true },
    })
    if (!propio) return apiError(404, "not_found", { req })

    /**
     * REGISTRAR LO RESUELTO NO GASTA CUOTA, y se contesta antes de pedirla.
     *
     * No hay llamada al modelo: es una escritura. Cobrarle una ranura al
     * usuario por decir "esto ya lo arreglé" sería cobrarle por no volver a
     * pedirnos trabajo.
     */
    if (parsed.data.action === "resolve") {
      const d = parsed.data
      const store = makeStore(d.resumeId, AI_MODEL_PROSE)
      const key = cacheKey.log(d.resumeId, cacheKey.jd(d.jobDescription, AI_MODEL_PROSE))
      /**
       * Lo que vuelve de la base se VALIDA, no se supone.
       *
       * `ResolutionLogSchema` estaba declarado para esto y no lo usaba nadie: la
       * fila se leía con un cast, así que un payload viejo, de otra versión o a
       * medio escribir entraba como si fuera bueno y volvía a guardarse. Un
       * registro ilegible se descarta entero y el usuario pierde memoria, nunca
       * el arreglo.
       */
      const crudo = await store.read("ats3-log", key)
      const previo: Resolution[] = ResolutionLogSchema.safeParse(crudo).data ?? []
      // Gana la resolución más nueva sobre el mismo hallazgo: el usuario puede
      // arreglar, romper y volver a arreglar la misma línea.
      const porId = new Map(previo.map((r) => [`${r.findingId}:${r.nodeId}`, r]))
      for (const e of d.entries) {
        porId.set(`${e.findingId}:${e.nodeId}`, { ...e, resolvedAt: new Date().toISOString() })
      }
      // El registro es memoria, no historial: se queda con lo último y no crece
      // sin techo dentro de una fila de la base.
      const todas = [...porId.values()].slice(-200)
      await store.write("ats3-log", key, todas)
      return NextResponse.json({ ok: true, stored: todas.length })
    }

    // Antes de gastar nada: si el plan no llega o la cuota se acabó, esto
    // responde con su código y el stream nunca se abre.
    await enforceAIQuota(authResult.userId, "ats3", authResult.user.plan)

    const model = AI_MODEL_PROSE

    /**
     * EL GASTO, SUMADO A LO LARGO DE LA PETICIÓN Y ESCRITO UNA SOLA VEZ.
     *
     * Una corrida usa hasta seis prompts. El panel de admin agrupa con
     * `_count: { id: true }`, así que una fila por prompt figuraría como seis
     * llamadas: la regla de la casa es UNA fila por petición.
     *
     * Sin esto el motor v3 gastaba tokens que no aparecían en ningún lado —
     * exactamente el defecto que este proyecto ya pagó con tres llamadas sin
     * contar. Se escribe al cerrar, incluso si el trabajo falló a mitad: lo
     * gastado se gastó igual.
     */
    const spend = { promptTokens: 0, completionTokens: 0, costUsd: 0 }
    const onUsage = (u: { promptTokens: number; completionTokens: number; cachedTokens: number }) => {
      spend.promptTokens += u.promptTokens
      spend.completionTokens += u.completionTokens
      spend.costUsd += computeCostUsd(model, u.promptTokens, u.completionTokens, u.cachedTokens)
    }
    const bill = () => {
      if (spend.promptTokens || spend.completionTokens) {
        logAIUsage(authResult.userId, "ats3", { model, plan: authResult.user.plan, ...spend })
      }
    }

    const ai = new AIAts3Module({ client: new OpenAIClientAdapter(), model, language: parsed.data.language, onUsage })
    const store = makeStore(parsed.data.resumeId, model)

    // ── REESCRIBIR UNA LÍNEA ────────────────────────────────────────────────
    // Responde JSON común: es una sola cosa y no hay nada que entregar en actos.
    if (parsed.data.action === "rewrite") {
      const d = parsed.data
      const tree = buildTree(d.resume as RawResume)
      const index = buildTermIndex(termsOf(d.spec, tree))
      const result = await runRewrite({
        tree,
        nodeId: d.nodeId,
        spec: d.spec,
        ledger: openLedger(tree, d.spec, new Set(d.covered)),
        index,
        language: d.language,
        model,
        jdKey: cacheKey.jd(d.jobDescription, model),
        focus: d.focus,
        mergeWith: d.mergeWith,
        addToRole: d.addToRole,
        ai,
        store,
      })
      bill()
      if (result.ok) {
        if (result.calls === 0) await refundDailyQuota(authResult.userId, "ats3", authResult.user.plan)
        return NextResponse.json({ ok: true, suggestion: result.suggestion, served: result.served })
      }
      /**
       * SIN RESULTADO NO SE COBRA LA RANURA (CEO, 2026-09-09).
       *
       * ── EL DEFECTO QUE ESTO CIERRA ────────────────────────────────────────
       * «No quiero bloqueos de nada.» El bloqueo que quedaba no era un guard:
       * era el PRECIO de un guard. Una reescritura que el motor no puede
       * entregar —porque repetía otra línea, porque se comía un dato del CV,
       * porque el modelo declinó— descontaba igual el uso del día. El usuario
       * apretaba, no recibía nada, y encima quedaba con una consulta menos: eso
       * es lo que hace que alguien deje de apretar el botón.
       *
       * Las llamadas al modelo YA se gastaron y se facturan —`bill()` corre
       * arriba, y `AIUsageLog` las anota: el costo real no se esconde—. Lo que
       * se devuelve es la RANURA de su cuota, que existe para medir el trabajo
       * entregado, no los intentos.
       *
       * Es la misma regla que el producto ya tenía escrita para todos sus
       * endpoints: ninguno entrega un hueco cobrando el uso.
       */
      await refundDailyQuota(authResult.userId, "ats3", authResult.user.plan)
      if (result.alreadyGood) {
        // No es un fallo: el modelo leyó la línea y dice que ya cumple.
        return NextResponse.json({ ok: false, reason: "already_good", detail: "" })
      }
      // Un rechazo NO es un error del sistema: es el motor haciendo su trabajo.
      // Se dice CUÁL fue, con su frase entera.
      return NextResponse.json(
        { ok: false, reason: result.verdict.ok ? "unknown" : result.verdict.reason, detail: result.verdict.ok ? "" : result.verdict.detail },
        { status: 200 },
      )
    }

    const gen = runAnalysis({
      raw: parsed.data.resume as RawResume,
      jdText: parsed.data.jobDescription,
      language: parsed.data.language,
      resumeId: parsed.data.resumeId,
      model,
      ai,
      store,
    })

    // El primer acto es código puro, pero el motor pide la vacante y la
    // auditoría antes de poder puntuar. Se espera A ESE acto y recién ahí se
    // abre el stream: hasta acá, cualquier fallo todavía puede responder con su
    // propio código HTTP.
    let first
    try {
      first = await gen.next()
    } catch (e) {
      bill()
      throw e
    }
    if (first.done) {
      bill()
      return apiError(502, "ai_error", { req })
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const enc = new TextEncoder()
        const write = (obj: unknown) => controller.enqueue(enc.encode(`${JSON.stringify(obj)}\n`))
        write(first.value)
        try {
          let step = await gen.next()
          while (!step.done) {
            write(step.value)
            step = await gen.next()
          }
          // La cuota se cobra ANTES de trabajar —es lo que frena un bucle— pero
          // una corrida servida entera del caché no gastó una sola llamada. Sin
          // este reembolso, el tope que existe para frenar el gasto cobraría por
          // peticiones que no gastaron nada.
          if (step.value.calls === 0) {
            await refundDailyQuota(authResult.userId, "ats3", authResult.user.plan)
          }
          write({ act: "done", telemetry: step.value })
        } catch (e) {
          // Un fallo después del primer byte no puede cambiar el estado HTTP: se
          // dice en la línea, para que el cliente deje de esperar un acto que no
          // va a llegar en vez de quedarse en blanco para siempre.
          write({ act: "error", error: e instanceof Error ? e.message : "ai_error" })
        }
        bill()
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        // Sin esto, un proxy junta los actos y los entrega de una: el streaming
        // existiría en el servidor y no en la pantalla.
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (err) {
    return handleError(err, {
      req,
      userId: authResult.userId,
      userEmail: authResult.user.email,
      payload: { resumeId: parsed.data.resumeId },
    })
  }
}
