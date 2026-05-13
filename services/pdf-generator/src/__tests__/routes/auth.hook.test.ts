jest.mock("../../browser/pool", () => ({
  activePageCount: jest.fn().mockReturnValue(0),
  queueDepth: jest.fn().mockReturnValue(0),
  withPage: jest.fn(),
}))
jest.mock("../../renderers/resume", () => ({ renderResumePdf: jest.fn() }))
jest.mock("../../renderers/cover-letter", () => ({ renderCoverLetterPdf: jest.fn() }))

import Fastify from "fastify"
import { registerAuthHook, isAuthorized } from "../../routes/auth.hook"
import { registerHealthRoute } from "../../routes/health.route"

function makeApp(secret = "s3cr3t") {
  const app = Fastify({ logger: false })
  registerAuthHook(app, secret)
  registerHealthRoute(app)
  app.post("/protected", async () => ({ ok: true }))
  return app
}

describe("isAuthorized (unit)", () => {
  it("returns false when auth is undefined", () => {
    expect(isAuthorized(undefined, "secret")).toBe(false)
  })

  it("returns false when auth is empty string", () => {
    expect(isAuthorized("", "secret")).toBe(false)
  })

  it("returns false when token does not match", () => {
    expect(isAuthorized("Bearer wrong", "secret")).toBe(false)
  })

  it("returns false when lengths differ (timing-safe short-circuit)", () => {
    expect(isAuthorized("Bearer x", "secret")).toBe(false)
  })

  it("returns true for correct token", () => {
    expect(isAuthorized("Bearer s3cr3t", "s3cr3t")).toBe(true)
  })
})

describe("registerAuthHook (integration)", () => {
  it("allows GET /health without Authorization header", async () => {
    const res = await makeApp().inject({ method: "GET", url: "/health" })
    expect(res.statusCode).toBe(200)
  })

  it("returns 401 when Authorization header is missing on protected route", async () => {
    const res = await makeApp().inject({ method: "POST", url: "/protected" })
    expect(res.statusCode).toBe(401)
    expect(JSON.parse(res.body)).toMatchObject({ error: "unauthorized" })
  })

  it("returns 401 when token is wrong", async () => {
    const res = await makeApp().inject({
      method: "POST", url: "/protected",
      headers: { authorization: "Bearer wrong-token" },
    })
    expect(res.statusCode).toBe(401)
  })

  it("allows request with correct Bearer token", async () => {
    const res = await makeApp("mytoken").inject({
      method: "POST", url: "/protected",
      headers: { authorization: "Bearer mytoken" },
    })
    expect(res.statusCode).toBe(200)
  })
})
