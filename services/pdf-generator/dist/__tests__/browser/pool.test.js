"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/chromium";
const mockClose = jest.fn().mockResolvedValue(undefined);
const mockPage = { close: mockClose };
const mockNewPage = jest.fn().mockResolvedValue(mockPage);
const mockVersion = jest.fn().mockResolvedValue("Chrome/120");
const mockOn = jest.fn();
const mockBrowser = { version: mockVersion, newPage: mockNewPage, on: mockOn };
const mockLaunch = jest.fn().mockResolvedValue(mockBrowser);
jest.mock("puppeteer-core", () => ({ __esModule: true, default: { launch: mockLaunch } }));
const pool_1 = require("../../browser/pool");
beforeEach(() => {
    jest.clearAllMocks();
    mockClose.mockResolvedValue(undefined);
    mockNewPage.mockResolvedValue(mockPage);
    mockVersion.mockResolvedValue("Chrome/120");
    mockOn.mockImplementation(() => { });
    mockLaunch.mockResolvedValue(mockBrowser);
});
describe("withPage", () => {
    it("resolves with fn return value", async () => {
        expect(await (0, pool_1.withPage)(async () => "ok")).toBe("ok");
    });
    it("calls page.close() after fn resolves", async () => {
        await (0, pool_1.withPage)(async () => { });
        expect(mockClose).toHaveBeenCalledTimes(1);
    });
    it("calls page.close() even when fn throws", async () => {
        await expect((0, pool_1.withPage)(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
        expect(mockClose).toHaveBeenCalledTimes(1);
    });
    it("logs error when page.close() fails without rethrowing", async () => {
        mockClose.mockRejectedValueOnce(new Error("close error"));
        const spy = jest.spyOn(console, "error").mockImplementation(() => { });
        await (0, pool_1.withPage)(async () => { });
        expect(spy).toHaveBeenCalledWith(expect.stringContaining("page.close() failed"));
        spy.mockRestore();
    });
});
describe("activePageCount / queueDepth", () => {
    it("returns numbers", () => {
        expect(typeof (0, pool_1.activePageCount)()).toBe("number");
        expect(typeof (0, pool_1.queueDepth)()).toBe("number");
    });
});
describe("concurrency — queue path", () => {
    it("queues second withPage when slot is full and processes it after first completes", async () => {
        process.env.MAX_CONCURRENT_PAGES = "1";
        // Signal emitted once p1's fn is actually executing (slot is held)
        let signalSlotAcquired;
        const slotAcquired = new Promise((r) => { signalSlotAcquired = r; });
        let releaseFirst;
        const blocker = new Promise((r) => { releaseFirst = r; });
        const secondPage = { close: jest.fn().mockResolvedValue(undefined) };
        mockNewPage.mockResolvedValueOnce(mockPage).mockResolvedValueOnce(secondPage);
        const p1 = (0, pool_1.withPage)(async () => { signalSlotAcquired(); await blocker; return "first"; });
        // Wait until p1 is definitely executing (slot acquired)
        await slotAcquired;
        const p2 = (0, pool_1.withPage)(async () => "second");
        // One microtask tick so p2's acquireSlot runs and pushes to queue
        await new Promise((r) => setImmediate(r));
        expect((0, pool_1.queueDepth)()).toBe(1);
        releaseFirst();
        const [r1, r2] = await Promise.all([p1, p2]);
        expect(r1).toBe("first");
        expect(r2).toBe("second");
        delete process.env.MAX_CONCURRENT_PAGES;
    });
});
