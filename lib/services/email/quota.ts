// lib/services/email/quota.ts
//
// Consumo de correo del mes, tomado de las cabeceras que Resend ya nos devuelve.
//
// POR QUÉ ASÍ: Resend no publica ningún endpoint para consultar el consumo — solo su
// panel web. Pero toda respuesta de su API trae `x-resend-monthly-quota`, documentada
// como "Your used monthly email sending quota". Leerla es gratis (viaja en una respuesta
// que ya pedimos) y el número es EL SUYO, así que no puede desviarse del que decide si
// hay que pagar el plan. Contar por nuestra cuenta habría producido una cifra distinta.

import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("email.quota")

/** Tope mensual del plan gratuito de Resend. Solo se usa si la cabecera no trae el suyo. */
export const RESEND_FREE_MONTHLY_LIMIT = 3000

/**
 * Tope mensual real de la cuenta, o null si no lo sabemos.
 *
 * POR QUÉ NULL Y NO 3000: suponer el tope gratuito para una cuenta de pago pintaba la
 * barra en rojo y gritaba "tope alcanzado" con 4.000 envíos legítimos — una alarma falsa
 * en el panel que decide si hay que pagar. Cuando no hay tope conocido el panel muestra
 * el consumo a secas, que es todo lo que podemos afirmar.
 *
 * `dailyRaw` es la señal: Resend SOLO manda la cabecera diaria a cuentas gratuitas.
 */
export function resolveMonthlyLimit(row: { monthlyLimit: number | null; dailyRaw: string | null }): number | null {
  if (row.monthlyLimit !== null) return row.monthlyLimit
  if (row.dailyRaw !== null) return RESEND_FREE_MONTHLY_LIMIT
  return null
}

export type QuotaReading = {
  monthlyRaw: string
  dailyRaw: string | null
  monthlyUsed: number | null
  monthlyLimit: number | null
}

/**
 * Mes UTC de una fecha, como "YYYY-MM".
 *
 * UTC y no la hora local a propósito: la cuota que corta es la de Resend, y un servidor
 * que cambie de zona no debe partir un mes en dos filas ni fundir dos meses en una.
 */
export function periodOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

/**
 * Lee el número de una cabecera de cuota.
 *
 * El FORMATO NO ESTÁ DOCUMENTADO: Resend describe qué significa la cabecera, no cómo la
 * escribe. Por eso esto acepta "12", "12/3000" y separadores de miles, y devuelve null
 * cuando no entiende — nunca un cero, que en un panel se lee como "no enviamos nada" y es
 * justo la conclusión contraria a la verdad. El crudo se guarda igual, así que un formato
 * inesperado se puede leer a ojo sin tocar el esquema.
 */
export function parseQuotaValue(raw: string | null | undefined): { used: number | null; limit: number | null } {
  if (!raw) return { used: null, limit: null }
  const nums = raw.match(/\d[\d.,]*/g)
  if (!nums || nums.length === 0) return { used: null, limit: null }
  const toInt = (s: string): number | null => {
    const n = Number.parseInt(s.replace(/[.,]/g, ""), 10)
    return Number.isFinite(n) ? n : null
  }
  return { used: toInt(nums[0]), limit: nums.length > 1 ? toInt(nums[1]) : null }
}

/** Extrae la lectura de cuota de las cabeceras de una respuesta de Resend. */
export function readQuotaHeaders(headers: Record<string, string> | null | undefined): QuotaReading | null {
  if (!headers) return null
  // Las cabeceras HTTP no distinguen mayúsculas; el SDK las entrega tal cual llegaron.
  const lower: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v

  const monthlyRaw = lower["x-resend-monthly-quota"]
  if (!monthlyRaw) return null
  // Solo llega a cuentas del plan gratuito: su AUSENCIA es la señal de que la cuenta ya
  // es de pago. Por eso se guarda aunque el panel no la muestre.
  const dailyRaw = lower["x-resend-daily-quota"] ?? null

  const { used, limit } = parseQuotaValue(monthlyRaw)
  return { monthlyRaw, dailyRaw, monthlyUsed: used, monthlyLimit: limit }
}

/**
 * Guarda la lectura en la fila del mes en curso.
 *
 * NUNCA lanza: esto corre pegado a un envío de correo, y perder la contabilidad de la
 * cuota no puede impedir que salga un código de verificación.
 */
export async function recordQuota(
  headers: Record<string, string> | null | undefined,
  now: Date = new Date(),
): Promise<void> {
  try {
    const reading = readQuotaHeaders(headers)
    if (!reading) return
    const period = periodOf(now)
    const data = {
      monthlyRaw: reading.monthlyRaw,
      dailyRaw: reading.dailyRaw,
      monthlyUsed: reading.monthlyUsed,
      monthlyLimit: reading.monthlyLimit,
      lastSeenAt: now,
    }
    await db.emailQuota.upsert({
      where: { period },
      create: { period, ...data, observations: 1 },
      update: { ...data, observations: { increment: 1 } },
    })
  } catch (e) {
    logger.error("no se pudo registrar la cuota de Resend", {}, e instanceof Error ? e : undefined)
  }
}
