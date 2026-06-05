"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const auth_hook_1 = require("./routes/auth.hook");
const health_route_1 = require("./routes/health.route");
const generate_pdf_route_1 = require("./routes/generate-pdf.route");
const generate_screenshot_route_1 = require("./routes/generate-screenshot.route");
/**
 * Builds and returns a configured Fastify application instance.
 * Logger is disabled in test mode to keep test output clean.
 */
function buildApp() {
    const secret = process.env.PDF_SERVICE_SECRET ?? "";
    const app = (0, fastify_1.default)({ logger: buildLogger() });
    (0, auth_hook_1.registerAuthHook)(app, secret);
    (0, health_route_1.registerHealthRoute)(app);
    (0, generate_pdf_route_1.registerGeneratePdfRoute)(app);
    (0, generate_screenshot_route_1.registerGenerateScreenshotRoute)(app);
    return app;
}
function buildLogger() {
    if (process.env.NODE_ENV === "test")
        return false;
    const isProd = process.env.NODE_ENV === "production";
    return {
        level: isProd ? "info" : "debug",
        transport: isProd ? undefined : { target: "pino-pretty", options: { colorize: true } },
    };
}
