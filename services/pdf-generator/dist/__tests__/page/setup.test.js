"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("../../page/setup");
const constants_1 = require("../../constants");
const mockSetViewport = jest.fn().mockResolvedValue(undefined);
const mockEmulateMediaType = jest.fn().mockResolvedValue(undefined);
const mockPage = { setViewport: mockSetViewport, emulateMediaType: mockEmulateMediaType };
describe("setA4Viewport", () => {
    it("sets A4 dimensions", async () => {
        await (0, setup_1.setA4Viewport)(mockPage);
        expect(mockSetViewport).toHaveBeenCalledWith({ width: constants_1.A4_WIDTH_PX, height: constants_1.A4_HEIGHT_PX, deviceScaleFactor: 1 });
    });
});
describe("emulateMediaType", () => {
    it("switches to print media", async () => {
        await (0, setup_1.emulateMediaType)(mockPage);
        expect(mockEmulateMediaType).toHaveBeenCalledWith("print");
    });
});
