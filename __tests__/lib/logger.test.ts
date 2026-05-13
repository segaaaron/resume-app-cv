import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createLogger } from "@/lib/logger"

describe("createLogger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => vi.restoreAllMocks())

  it("info writes JSON with level=info, service, message, context", () => {
    const logger = createLogger("RegistrationService")
    logger.info("OTP sent", { email: "a@b.com" })
    expect(console.log).toHaveBeenCalledOnce()
    const arg = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(arg).toMatchObject({ level: "info", service: "RegistrationService", message: "OTP sent", email: "a@b.com" })
    expect(typeof arg.timestamp).toBe("string")
  })

  it("warn writes JSON with level=warn", () => {
    const logger = createLogger("RegistrationService")
    logger.warn("rate limited", { ip: "1.2.3.4" })
    expect(console.warn).toHaveBeenCalledOnce()
    const arg = JSON.parse((console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(arg).toMatchObject({ level: "warn", service: "RegistrationService", message: "rate limited", ip: "1.2.3.4" })
  })

  it("error writes JSON with level=error and includes stack when Error passed", () => {
    const logger = createLogger("PasswordResetService")
    const err = new Error("boom")
    logger.error("DB write failed", { email: "x@y.com" }, err)
    expect(console.error).toHaveBeenCalledOnce()
    const arg = JSON.parse((console.error as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(arg).toMatchObject({ level: "error", service: "PasswordResetService", message: "DB write failed", email: "x@y.com" })
    expect(typeof arg.stack).toBe("string")
  })

  it("info without context does not throw", () => {
    const logger = createLogger("SessionChallengeService")
    expect(() => logger.info("no context")).not.toThrow()
  })
})
