import { describe, it, expect, vi, beforeEach } from "vitest"
import { createHmac } from "crypto"

// El producto sabía si Resend ACEPTÓ un envío, nunca si llegó. Un usuario que no recibe su
// código era indistinguible de uno que nunca se registró.

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/services/error/errorLog", () => ({ logError: vi.fn() }))
vi.mock("@/lib/logger", () => ({ createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) }))

import { POST } from "@/app/api/webhooks/resend/route"
import { logError } from "@/lib/services/error/errorLog"

const SECRET = "shh"
const send = (body: unknown, sig?: string) => {
  const raw = JSON.stringify(body)
  const signature = sig ?? createHmac("sha256", SECRET).update(raw).digest("hex")
  return new Request("https://app.test/api/webhooks/resend", {
    method: "POST",
    body: raw,
    headers: { "resend-signature": signature },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.RESEND_WEBHOOK_SECRET = SECRET
})

describe("webhook de Resend · rebotes", () => {
  it("sin secreto configurado no procesa nada", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET
    const res = await POST(send({ type: "email.bounced" }))
    expect(res.status).toBe(503)
    expect(logError).not.toHaveBeenCalled()
  })

  it("rechaza una firma inválida — si no, cualquiera escribe en el panel del admin", async () => {
    const res = await POST(send({ type: "email.bounced" }, "firmafalsa"))
    expect(res.status).toBe(400)
    expect(logError).not.toHaveBeenCalled()
  })

  it("registra un rebote con el email y el motivo", async () => {
    const res = await POST(send({
      type: "email.bounced",
      data: { to: ["ana@x.com"], subject: "Tu código", bounce: { type: "hard", message: "mailbox not found" } },
    }))
    expect(res.status).toBe(200)
    const arg = vi.mocked(logError).mock.calls[0][0]
    expect(arg.source).toBe("email")
    expect(arg.userEmail).toBe("ana@x.com")
    expect(arg.message).toContain("mailbox not found")
  })

  it("registra una queja de spam", async () => {
    await POST(send({ type: "email.complained", data: { to: "b@x.com" } }))
    expect(vi.mocked(logError).mock.calls[0][0].endpoint).toBe("email.complained")
  })

  it("un correo ENTREGADO no se registra — llenaría la tabla y taparía los rebotes", async () => {
    const res = await POST(send({ type: "email.delivered", data: { to: "c@x.com" } }))
    expect(res.status).toBe(200)
    expect(logError).not.toHaveBeenCalled()
  })

  it("un evento desconocido responde 200 para que Resend no reintente para siempre", async () => {
    const res = await POST(send({ type: "email.something_new" }))
    expect(res.status).toBe(200)
    expect(logError).not.toHaveBeenCalled()
  })
})
