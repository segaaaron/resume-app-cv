"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGeneratePdfRoute = registerGeneratePdfRoute;
const pool_1 = require("../browser/pool");
const timeout_1 = require("../lib/timeout");
const constants_1 = require("../constants");
const contracts_1 = require("../contracts");
const resume_1 = require("../renderers/resume");
const cover_letter_1 = require("../renderers/cover-letter");
/** Registers POST /generate-pdf. Dispatches to resume or cover-letter renderer. */
function registerGeneratePdfRoute(app) {
    app.post("/generate-pdf", handleGeneratePdf);
}
async function handleGeneratePdf(request, reply) {
    const body = request.body ?? {};
    if (!body.printUrl) {
        request.log.warn("[generate-pdf] printUrl missing — caller must send { printUrl, cookies, stretchPages }");
        reply.code(400).send({ error: "missing printUrl" });
        return;
    }
    // pdf-generator microservice only — convert web app boolean to internal render type
    const type = (0, contracts_1.toRenderType)(body.stretchPages);
    const start = Date.now();
    request.log.info({ printUrl: body.printUrl, type }, "[generate-pdf] render started");
    try {
        const pdf = await (0, timeout_1.withTimeout)((0, pool_1.withPage)((page) => dispatchRenderer(page, body)), constants_1.RENDER_TIMEOUT_MS, "generate-pdf");
        request.log.info({ printUrl: body.printUrl, type, durationMs: Date.now() - start, sizeBytes: pdf.length }, "[generate-pdf] render complete");
        reply.header("Content-Type", "application/pdf").send(pdf);
    }
    catch (err) {
        sendRenderError(request, reply, err, body, type, start);
    }
}
function dispatchRenderer(page, body) {
    const appUrl = new URL(body.printUrl).origin;
    // pdf-generator microservice only — route to renderer based on internal type
    if ((0, contracts_1.toRenderType)(body.stretchPages) === "resume") {
        return (0, resume_1.renderResumePdf)(page, { printUrl: body.printUrl, cookieHeader: body.cookies ?? "", appUrl, candidateName: body.candidateName, resumeTitle: body.resumeTitle });
    }
    return (0, cover_letter_1.renderCoverLetterPdf)(page, { printUrl: body.printUrl, cookieHeader: body.cookies ?? "", appUrl, candidateName: body.candidateName, letterTitle: body.letterTitle });
}
function sendRenderError(request, reply, err, body, type, start) {
    const msg = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - start;
    const isTimeout = msg.toLowerCase().includes("timeout");
    const rootCause = isTimeout
        ? `Render timed out after ${durationMs}ms — app may be slow, print token expired, or selector never appeared.`
        : `Render failed after ${durationMs}ms: "${msg}" — check Chrome logs above.`;
    request.log.error({ err, printUrl: body.printUrl, type, durationMs }, `[generate-pdf] ${rootCause}`);
    console.error(`[generate-pdf] FAILED | type=${type} | url=${body.printUrl} | ${durationMs}ms | ${rootCause}`);
    reply.code(500).send({ error: "render failed", detail: isTimeout ? "timeout" : msg });
}
