"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock("../browser/pool", () => ({
    activePageCount: jest.fn().mockReturnValue(0),
    queueDepth: jest.fn().mockReturnValue(0),
    withPage: jest.fn().mockImplementation((fn) => fn({})),
}));
jest.mock("../renderers/resume", () => ({ renderResumePdf: jest.fn().mockResolvedValue(Buffer.from("%PDF-1.4 resume")) }));
jest.mock("../renderers/cover-letter", () => ({ renderCoverLetterPdf: jest.fn().mockResolvedValue(Buffer.from("%PDF-1.4 cover-letter")) }));
const app_1 = require("../app");
const resume_1 = require("../renderers/resume");
const cover_letter_1 = require("../renderers/cover-letter");
const SECRET = "test-secret";
const makeApp = () => { process.env.PDF_SERVICE_SECRET = SECRET; return (0, app_1.buildApp)(); };
describe("GET /health", () => {
    it("returns 200 with status ok — no auth required", async () => {
        const res = await makeApp().inject({ method: "GET", url: "/health" });
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toMatchObject({ status: "ok", activePages: expect.any(Number), queueDepth: expect.any(Number) });
    });
});
describe("POST /generate-pdf — authentication", () => {
    it("returns 401 when no Authorization header", async () => {
        const res = await makeApp().inject({ method: "POST", url: "/generate-pdf", payload: { printUrl: "https://app.readycvv.com/print/123" } });
        expect(res.statusCode).toBe(401);
        expect(JSON.parse(res.body)).toMatchObject({ error: "unauthorized" });
    });
    it("returns 401 when token is wrong", async () => {
        const res = await makeApp().inject({ method: "POST", url: "/generate-pdf", headers: { authorization: "Bearer wrong" }, payload: { printUrl: "https://app.readycvv.com/print/123" } });
        expect(res.statusCode).toBe(401);
    });
});
describe("POST /generate-pdf — validation", () => {
    it("returns 400 when printUrl is missing", async () => {
        const res = await makeApp().inject({ method: "POST", url: "/generate-pdf", headers: { authorization: `Bearer ${SECRET}` }, payload: {} });
        expect(res.statusCode).toBe(400);
        expect(JSON.parse(res.body)).toMatchObject({ error: "missing printUrl" });
    });
});
describe("POST /generate-pdf — rendering", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resume_1.renderResumePdf.mockResolvedValue(Buffer.from("%PDF-1.4 resume"));
        cover_letter_1.renderCoverLetterPdf.mockResolvedValue(Buffer.from("%PDF-1.4 cover-letter"));
    });
    it("calls renderResumePdf when stretchPages=true", async () => {
        const res = await makeApp().inject({ method: "POST", url: "/generate-pdf", headers: { authorization: `Bearer ${SECRET}`, "content-type": "application/json" }, payload: { printUrl: "https://app.readycvv.com/print/resume/1", cookies: "", stretchPages: true } });
        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toMatch(/application\/pdf/);
        expect(resume_1.renderResumePdf).toHaveBeenCalledTimes(1);
        expect(cover_letter_1.renderCoverLetterPdf).not.toHaveBeenCalled();
    });
    it("calls renderCoverLetterPdf when stretchPages=false", async () => {
        const res = await makeApp().inject({ method: "POST", url: "/generate-pdf", headers: { authorization: `Bearer ${SECRET}`, "content-type": "application/json" }, payload: { printUrl: "https://app.readycvv.com/print/cover-letter/1", cookies: "", stretchPages: false } });
        expect(res.statusCode).toBe(200);
        expect(cover_letter_1.renderCoverLetterPdf).toHaveBeenCalledTimes(1);
    });
    it("returns 500 with detail:timeout on timeout error", async () => {
        ;
        resume_1.renderResumePdf.mockRejectedValue(new Error("Timeout: generate-pdf after 45000ms"));
        const res = await makeApp().inject({ method: "POST", url: "/generate-pdf", headers: { authorization: `Bearer ${SECRET}`, "content-type": "application/json" }, payload: { printUrl: "https://app.readycvv.com/print/resume/1", cookies: "", stretchPages: true } });
        expect(res.statusCode).toBe(500);
        expect(JSON.parse(res.body)).toMatchObject({ error: "render failed", detail: "timeout" });
    });
    it("returns 500 with error message on generic error", async () => {
        ;
        resume_1.renderResumePdf.mockRejectedValue(new Error("Page crashed"));
        const res = await makeApp().inject({ method: "POST", url: "/generate-pdf", headers: { authorization: `Bearer ${SECRET}`, "content-type": "application/json" }, payload: { printUrl: "https://app.readycvv.com/print/resume/1", cookies: "", stretchPages: true } });
        expect(res.statusCode).toBe(500);
        expect(JSON.parse(res.body)).toMatchObject({ error: "render failed", detail: "Page crashed" });
    });
});
