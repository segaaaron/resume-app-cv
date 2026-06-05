"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCookies = parseCookies;
exports.applyCookies = applyCookies;
const contracts_1 = require("./contracts");
function parseCookies(cookieHeader, hostname, appUrl) {
    return cookieHeader
        .split(";")
        .map((c) => {
        const eq = c.indexOf("=");
        if (eq < 0)
            return null;
        const name = c.slice(0, eq).trim();
        const rawValue = c.slice(eq + 1).trim();
        let value;
        try {
            value = decodeURIComponent(rawValue);
        }
        catch {
            value = rawValue;
        }
        if (!name)
            return null;
        if (name.startsWith("__Host-"))
            return { name, value, url: appUrl, secure: true, path: "/" };
        if (name.startsWith("__Secure-"))
            return { name, value, domain: hostname, secure: true };
        return { name, value, domain: hostname };
    })
        .filter((c) => c !== null);
}
async function applyCookies(page, cookieHeader, appUrl) {
    if (!cookieHeader)
        return;
    const hostname = new URL(appUrl).hostname;
    const all = parseCookies(cookieHeader, hostname, appUrl);
    if (all.length === 0)
        return;
    const allowed = all.filter((c) => contracts_1.ALLOWED_COOKIE_NAMES.has(c.name));
    const hasSession = allowed.some((c) => contracts_1.SESSION_COOKIE_NAMES.has(c.name));
    if (!hasSession) {
        console.warn("[pdf] session cookie not found in whitelist — forwarding all as fallback");
        await page.setCookie(...all);
        return;
    }
    await page.setCookie(...allowed);
}
