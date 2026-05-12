"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const browser_pool_1 = require("./browser-pool");
const constants_1 = require("./constants");
const print_helpers_1 = require("./print-helpers");
const cover_letter_1 = require("./renderers/cover-letter");
const resume_1 = require("./renderers/resume");
const PDF_SERVICE_SECRET = process.env.PDF_SERVICE_SECRET;
const PORT = parseInt(process.env.PORT ?? "3001", 10);
if (!PDF_SERVICE_SECRET) {
    console.error("[pdf-generator] PDF_SERVICE_SECRET env var is required — exiting");
    process.exit(1);
}
const app = (0, fastify_1.default)({ logger: true });
app.get("/health", async () => {
    return { status: "ok", activePages: (0, browser_pool_1.activePageCount)(), queueDepth: (0, browser_pool_1.queueDepth)() };
});
app.addHook("onRequest", async (request, reply) => {
    if (request.url === "/health" && request.method === "GET")
        return;
    const auth = request.headers.authorization;
    if (!auth || auth !== `Bearer ${PDF_SERVICE_SECRET}`) {
        return reply.code(401).send({ error: "unauthorized" });
    }
});
app.post("/generate-pdf", async (request, reply) => {
    const { printUrl, cookies, stretchPages, candidateName, resumeTitle, letterTitle } = request.body ?? {};
    if (!printUrl) {
        return reply.code(400).send({ error: "missing printUrl" });
    }
    const appUrl = new URL(printUrl).origin;
    try {
        const pdf = await (0, print_helpers_1.withTimeout)((0, browser_pool_1.withPage)((page) => stretchPages
            ? (0, resume_1.renderResumePdf)(page, { printUrl, cookieHeader: cookies ?? "", appUrl, candidateName, resumeTitle })
            : (0, cover_letter_1.renderCoverLetterPdf)(page, { printUrl, cookieHeader: cookies ?? "", appUrl, candidateName, letterTitle })), constants_1.RENDER_TIMEOUT_MS, "generate-pdf");
        reply.header("Content-Type", "application/pdf");
        return reply.send(pdf);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        request.log.error({ err }, "PDF render failed");
        if (msg.toLowerCase().includes("timeout")) {
            return reply.code(500).send({ error: "render failed", detail: "timeout" });
        }
        return reply.code(500).send({ error: "render failed", detail: msg });
    }
});
app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`[pdf-generator] listening on port ${PORT}`);
});
