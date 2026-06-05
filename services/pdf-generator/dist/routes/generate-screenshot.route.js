"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGenerateScreenshotRoute = registerGenerateScreenshotRoute;
const pool_1 = require("../browser/pool");
const timeout_1 = require("../lib/timeout");
const constants_1 = require("../constants");
const screenshot_1 = require("../renderers/screenshot");
/** Registers POST /generate-screenshot. Returns a WebP buffer of the full A4 resume page. */
function registerGenerateScreenshotRoute(app) {
    app.post("/generate-screenshot", handleGenerateScreenshot);
}
async function handleGenerateScreenshot(request, reply) {
    const body = request.body ?? {};
    if (!body.printUrl) {
        reply.code(400).send({ error: "missing printUrl" });
        return;
    }
    const appUrl = new URL(body.printUrl).origin;
    const start = Date.now();
    request.log.info({ printUrl: body.printUrl }, "[generate-screenshot] render started");
    try {
        const screenshot = await (0, timeout_1.withTimeout)((0, pool_1.withPage)((page) => (0, screenshot_1.renderResumeScreenshot)(page, {
            printUrl: body.printUrl,
            cookieHeader: body.cookies ?? "",
            appUrl,
        })), constants_1.RENDER_TIMEOUT_MS, "generate-screenshot");
        request.log.info({ durationMs: Date.now() - start, sizeBytes: screenshot.length }, "[generate-screenshot] done");
        reply.header("Content-Type", "image/webp").send(screenshot);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err, printUrl: body.printUrl, durationMs: Date.now() - start }, "[generate-screenshot] failed");
        reply.code(500).send({ error: "screenshot failed", detail: msg });
    }
}
