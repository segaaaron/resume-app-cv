"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock("../../browser/pool", () => ({
    activePageCount: jest.fn().mockReturnValue(0),
    queueDepth: jest.fn().mockReturnValue(0),
    withPage: jest.fn(),
}));
jest.mock("../../renderers/resume", () => ({ renderResumePdf: jest.fn() }));
jest.mock("../../renderers/cover-letter", () => ({ renderCoverLetterPdf: jest.fn() }));
const fastify_1 = __importDefault(require("fastify"));
const auth_hook_1 = require("../../routes/auth.hook");
const health_route_1 = require("../../routes/health.route");
function makeApp(secret = "s3cr3t") {
    const app = (0, fastify_1.default)({ logger: false });
    (0, auth_hook_1.registerAuthHook)(app, secret);
    (0, health_route_1.registerHealthRoute)(app);
    app.post("/protected", async () => ({ ok: true }));
    return app;
}
describe("isAuthorized (unit)", () => {
    it("returns false when auth is undefined", () => {
        expect((0, auth_hook_1.isAuthorized)(undefined, "secret")).toBe(false);
    });
    it("returns false when auth is empty string", () => {
        expect((0, auth_hook_1.isAuthorized)("", "secret")).toBe(false);
    });
    it("returns false when token does not match", () => {
        expect((0, auth_hook_1.isAuthorized)("Bearer wrong", "secret")).toBe(false);
    });
    it("returns false when lengths differ (timing-safe short-circuit)", () => {
        expect((0, auth_hook_1.isAuthorized)("Bearer x", "secret")).toBe(false);
    });
    it("returns true for correct token", () => {
        expect((0, auth_hook_1.isAuthorized)("Bearer s3cr3t", "s3cr3t")).toBe(true);
    });
});
describe("registerAuthHook (integration)", () => {
    it("allows GET /health without Authorization header", async () => {
        const res = await makeApp().inject({ method: "GET", url: "/health" });
        expect(res.statusCode).toBe(200);
    });
    it("returns 401 when Authorization header is missing on protected route", async () => {
        const res = await makeApp().inject({ method: "POST", url: "/protected" });
        expect(res.statusCode).toBe(401);
        expect(JSON.parse(res.body)).toMatchObject({ error: "unauthorized" });
    });
    it("returns 401 when token is wrong", async () => {
        const res = await makeApp().inject({
            method: "POST", url: "/protected",
            headers: { authorization: "Bearer wrong-token" },
        });
        expect(res.statusCode).toBe(401);
    });
    it("allows request with correct Bearer token", async () => {
        const res = await makeApp("mytoken").inject({
            method: "POST", url: "/protected",
            headers: { authorization: "Bearer mytoken" },
        });
        expect(res.statusCode).toBe(200);
    });
});
