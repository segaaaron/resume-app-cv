"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const app_1 = require("./app");
const lifecycle_1 = require("./browser/lifecycle");
const PORT = parseInt(process.env.PORT ?? "3001", 10);
/**
 * Validates required environment variables and starts the HTTP server.
 * Called only when this module is the entry point (require.main === module).
 */
function startServer() {
    assertEnvVars();
    logStartupConfig();
    const app = (0, app_1.buildApp)();
    app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
        if (err) {
            console.error("[server] Failed to start:", err);
            process.exit(1);
        }
        console.log(`[server] listening on port ${PORT}`);
        (0, lifecycle_1.getBrowser)().then(() => console.log("[server] Chrome pre-warmed")).catch((err) => console.warn("[server] Chrome pre-warm failed:", err));
    });
}
function assertEnvVars() {
    if (!process.env.PDF_SERVICE_SECRET) {
        console.error("[server] Startup aborted: PDF_SERVICE_SECRET not set. Set in .env.local (dev) or Dokploy (prod).");
        process.exit(1);
    }
}
function logStartupConfig() {
    console.log("[server] config:");
    console.log(`  PORT=${PORT}`);
    console.log(`  MAX_CONCURRENT_PAGES=${process.env.MAX_CONCURRENT_PAGES ?? "3 (default)"}`);
    console.log(`  PUPPETEER_EXECUTABLE_PATH=${process.env.PUPPETEER_EXECUTABLE_PATH ?? "(not set)"}`);
    console.log(`  NODE_ENV=${process.env.NODE_ENV ?? "development"}`);
}
if (require.main === module)
    startServer();
