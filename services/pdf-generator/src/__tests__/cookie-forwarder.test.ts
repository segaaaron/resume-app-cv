import { parseCookies, applyCookies } from "../cookie-forwarder"
import type { Page } from "puppeteer-core"

const APP_URL = "https://app.readycvv.com"
const HOSTNAME = "app.readycvv.com"

// ---------------------------------------------------------------------------
// parseCookies
// ---------------------------------------------------------------------------

describe("parseCookies", () => {
  it("returns empty array for empty string", () => {
    expect(parseCookies("", HOSTNAME, APP_URL)).toEqual([])
  })

  it("parses a single name=value cookie", () => {
    const result = parseCookies("name=value", HOSTNAME, APP_URL)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ name: "name", value: "value", domain: HOSTNAME })
  })

  it("parses multiple cookies separated by semicolons", () => {
    const result = parseCookies("a=1; b=2; c=3", HOSTNAME, APP_URL)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ name: "a", value: "1" })
    expect(result[1]).toMatchObject({ name: "b", value: "2" })
    expect(result[2]).toMatchObject({ name: "c", value: "3" })
  })

  it("__Host- cookies get url, secure:true and path:/", () => {
    const result = parseCookies("__Host-authjs.session-token=tok123", HOSTNAME, APP_URL)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      name: "__Host-authjs.session-token",
      value: "tok123",
      url: APP_URL,
      secure: true,
      path: "/",
    })
    // domain should NOT be set
    expect(result[0]).not.toHaveProperty("domain")
  })

  it("__Secure- cookies get domain and secure:true", () => {
    const result = parseCookies("__Secure-authjs.callback-url=https%3A%2F%2Fapp.readycvv.com", HOSTNAME, APP_URL)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      name: "__Secure-authjs.callback-url",
      domain: HOSTNAME,
      secure: true,
    })
  })

  it("cookie with value that fails decodeURIComponent uses raw value", () => {
    // Malformed percent-encoding
    const result = parseCookies("bad=%%invalid%%", HOSTNAME, APP_URL)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ name: "bad", value: "%%invalid%%" })
  })

  it("cookie without '=' is filtered out", () => {
    const result = parseCookies("noequalssign", HOSTNAME, APP_URL)
    expect(result).toEqual([])
  })

  it("cookie with empty name is filtered out", () => {
    // "=value" has empty name
    const result = parseCookies("=value", HOSTNAME, APP_URL)
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// applyCookies
// ---------------------------------------------------------------------------

function makeMockPage(): { setCookie: jest.Mock } {
  return { setCookie: jest.fn().mockResolvedValue(undefined) }
}

describe("applyCookies", () => {
  it("does nothing when cookieHeader is empty string", async () => {
    const page = makeMockPage()
    await applyCookies(page as unknown as Page, "", APP_URL)
    expect(page.setCookie).not.toHaveBeenCalled()
  })

  it("calls setCookie with only whitelisted cookies when session cookie is present", async () => {
    const page = makeMockPage()
    // authjs.session-token is in both ALLOWED_COOKIES and SESSION_COOKIE_NAMES
    const header = "authjs.session-token=mysesstoken; unknownCookie=secretdata"
    await applyCookies(page as unknown as Page, header, APP_URL)
    expect(page.setCookie).toHaveBeenCalledTimes(1)
    // setCookie is called as page.setCookie(...allowed) — spread args become positional params
    const callArgs: Array<{ name: string }> = page.setCookie.mock.calls[0]
    const names = callArgs.map((c: { name: string }) => c.name)
    expect(names).toContain("authjs.session-token")
    expect(names).not.toContain("unknownCookie")
  })

  it("forwards ALL cookies as fallback and warns when no session cookie present", async () => {
    const page = makeMockPage()
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
    const header = "NEXT_LOCALE=es; unknownCookie=data"
    await applyCookies(page as unknown as Page, header, APP_URL)
    expect(page.setCookie).toHaveBeenCalledTimes(1)
    const args: Array<{ name: string }> = page.setCookie.mock.calls[0]
    const names = args.map((c) => c.name)
    expect(names).toContain("NEXT_LOCALE")
    expect(names).toContain("unknownCookie")
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("session cookie not found in whitelist"),
    )
    warnSpy.mockRestore()
  })

  it("does not call setCookie when all cookies are invalid (no '=')", async () => {
    const page = makeMockPage()
    await applyCookies(page as unknown as Page, "noequalssign", APP_URL)
    expect(page.setCookie).not.toHaveBeenCalled()
  })
})
