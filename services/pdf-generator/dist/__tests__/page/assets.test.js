"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assets_1 = require("../../page/assets");
const constants_1 = require("../../constants");
describe("waitForFonts", () => {
    afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
    it("resolves without warning when fonts load quickly", async () => {
        jest.useFakeTimers();
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const page = { evaluate: jest.fn().mockResolvedValue(undefined) };
        await (0, assets_1.waitForFonts)(page);
        expect(warnSpy).not.toHaveBeenCalled();
        warnSpy.mockRestore();
    });
    it("warns when fonts time out", async () => {
        jest.useFakeTimers();
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const page = { evaluate: jest.fn().mockReturnValue(new Promise(() => { })) };
        const p = (0, assets_1.waitForFonts)(page);
        jest.runAllTimers();
        await p;
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(`${constants_1.FONTS_TIMEOUT_MS}ms`));
        warnSpy.mockRestore();
    });
});
describe("waitForImages", () => {
    afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
    it("resolves when evaluate resolves immediately", async () => {
        const page = { evaluate: jest.fn().mockResolvedValue(undefined) };
        await expect((0, assets_1.waitForImages)(page, 3000)).resolves.toBeUndefined();
    });
    it("warns and resolves on timeout", async () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
        let callCount = 0;
        // First call returns false (images not ready); second call returns 0 (brokenCount)
        const page = {
            evaluate: jest.fn().mockImplementation(() => Promise.resolve(callCount++ === 0 ? false : 0)),
        };
        await (0, assets_1.waitForImages)(page, 50);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("50ms"));
        warnSpy.mockRestore();
    }, 3000);
});
describe("evaluateImages (browser-side fn, tested in Node with mocked document)", () => {
    afterEach(() => { delete global.document; });
    it("resolves immediately when all images are already complete", async () => {
        ;
        global.document = { images: [{ complete: true }, { complete: true }] };
        await expect((0, assets_1.evaluateImages)()).resolves.toEqual([]);
    });
    it("resolves when incomplete image fires onload", async () => {
        const img = { complete: false, onload: null, onerror: null };
        global.document = { images: [img] };
        const p = (0, assets_1.evaluateImages)();
        img.onload();
        await expect(p).resolves.toBeDefined();
    });
    it("resolves when incomplete image fires onerror", async () => {
        const img = { complete: false, onload: null, onerror: null };
        global.document = { images: [img] };
        const p = (0, assets_1.evaluateImages)();
        img.onerror();
        await expect(p).resolves.toBeDefined();
    });
    it("resolves immediately with empty array when document has no images", async () => {
        ;
        global.document = { images: [] };
        await expect((0, assets_1.evaluateImages)()).resolves.toEqual([]);
    });
});
