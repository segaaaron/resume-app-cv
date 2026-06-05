"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthHook = registerAuthHook;
exports.isAuthorized = isAuthorized;
const crypto_1 = require("crypto");
const PUBLIC_ROUTES = new Set(["/health", "/", "/favicon.ico"]);
/**
 * Registers the Bearer token auth hook on all non-public routes.
 * Returns 401 with a descriptive log when token is missing or wrong.
 * Uses timingSafeEqual to prevent timing-based token enumeration attacks.
 */
function registerAuthHook(app, secret) {
    app.addHook("onRequest", async (request, reply) => {
        if (PUBLIC_ROUTES.has(request.url) && request.method === "GET")
            return;
        const auth = request.headers.authorization;
        if (isAuthorized(auth, secret))
            return;
        request.log.warn({ url: request.url, ip: request.ip, hasHeader: !!auth }, `[auth] ${!auth ? "Authorization header missing" : "Bearer token does not match PDF_SERVICE_SECRET"}`);
        return reply.code(401).send({ error: "unauthorized" });
    });
}
/**
 * Compares the Authorization header against the expected Bearer token
 * using a constant-time comparison to prevent timing attacks.
 */
function isAuthorized(auth, secret) {
    if (!auth)
        return false;
    const expected = Buffer.from(`Bearer ${secret}`);
    const got = Buffer.from(auth);
    return expected.length === got.length && (0, crypto_1.timingSafeEqual)(expected, got);
}
