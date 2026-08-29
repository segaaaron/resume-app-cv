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
import { AI_MODEL_PROSE } from "@/lib/ai-client"
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
import type { ParseChecks } from "@/lib/ats3/score"

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
})

const analyzeSchema = z.object({
  action: z.literal("analyze").optional(),
  resumeId: z.string().max(64),
  jobDescription: z.string().min(20).max(LIMITS.jd),
  language: z.enum(["es", "en"]).default("es"),
  resume: resumeSchema,
  /**
   * Verificaciones de lectura automática que el cliente ya midió sobre el
   * documento renderizado. `null` = no se pudo medir, y entonces sale del
   * denominador en vez de contar como fallada: castigar por algo que nadie miró
   * es fabricar un defecto.
   */
  checks: z.record(z.string().max(40), z.boolean().nullable()).default({}),
})

const schema = z.union([rewriteSchema, analyzeSchema])

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
      try {
        await db.aiAnswerCache.create({
          data: {
            kind,
            inputHash: hash,
            payload: payload as Prisma.InputJsonValue,
            model,
            // La vacante no depende de ningún CV: dos candidatos que pegan el
            // mismo aviso comparten la respuesta, y por eso no cuelga de uno.
            resumeId: kind === "ats3-jd" ? null : resumeId,
          },
        })
      } catch {
        // Clave repetida = otra petición contestó primero. Nada que hacer.
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
    // Antes de gastar nada: si el plan no llega o la cuota se acabó, esto
    // responde con su código y el stream nunca se abre.
    await enforceAIQuota(authResult.userId, "ats3", authResult.user.plan)

    const model = AI_MODEL_PROSE
    const ai = new AIAts3Module({ client: new OpenAIClientAdapter(), model, language: parsed.data.language })
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
        ai,
        store,
      })
      if (result.ok) {
        if (result.calls === 0) await refundDailyQuota(authResult.userId, "ats3", authResult.user.plan)
        return NextResponse.json({ ok: true, suggestion: result.suggestion, served: result.served })
      }
      if (result.alreadyGood) {
        // No es un fallo y no se cobra como tal: la línea ya cumple.
        if (result.calls === 0) await refundDailyQuota(authResult.userId, "ats3", authResult.user.plan)
        return NextResponse.json({ ok: false, reason: "already_good", detail: "" })
      }
      // Un rechazo NO es un error del sistema: es el motor haciendo su trabajo.
      // Se dice CUÁL fue, porque "no se pudo" con el uso ya cobrado es lo que
      // hace que alguien deje de apretar el botón.
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
      checks: parsed.data.checks as ParseChecks,
      ai,
      store,
    })

    // El primer acto es código puro, pero el motor pide la vacante y la
    // auditoría antes de poder puntuar. Se espera A ESE acto y recién ahí se
    // abre el stream: hasta acá, cualquier fallo todavía puede responder con su
    // propio código HTTP.
    const first = await gen.next()
    if (first.done) return apiError(502, "ai_error", { req })

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
