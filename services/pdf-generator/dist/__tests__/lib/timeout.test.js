"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const timeout_1 = require("../../lib/timeout");
describe("withTimeout", () => {
    it("resolves when promise settles before deadline", async () => {
        await expect((0, timeout_1.withTimeout)(Promise.resolve(42), 1000, "t")).resolves.toBe(42);
    });
    it("rejects with timeout message when deadline fires first", async () => {
        const never = new Promise(() => { });
        await expect((0, timeout_1.withTimeout)(never, 50, "slow")).rejects.toThrow("Timeout: slow after 50ms");
    });
    it("propagates original rejection before deadline", async () => {
        await expect((0, timeout_1.withTimeout)(Promise.reject(new Error("boom")), 1000, "t")).rejects.toThrow("boom");
    });
});
