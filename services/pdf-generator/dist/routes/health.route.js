"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHealthRoute = registerHealthRoute;
const pool_1 = require("../browser/pool");
/**
 * Registers GET /health — returns pool status, no auth required.
 */
function registerHealthRoute(app) {
    app.get("/health", async () => ({
        status: "ok",
        activePages: (0, pool_1.activePageCount)(),
        queueDepth: (0, pool_1.queueDepth)(),
    }));
}
