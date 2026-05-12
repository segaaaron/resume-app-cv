"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderResumePdf = renderResumePdf;
const pdf_lib_1 = require("pdf-lib");
const cookie_forwarder_1 = require("../cookie-forwarder");
const constants_1 = require("../constants");
const print_helpers_1 = require("../print-helpers");
const WRAPPER_SELECTOR = ".resume-pages > div";
async function renderResumePdf(page, opts) {
    await (0, print_helpers_1.setA4Viewport)(page);
    await (0, cookie_forwarder_1.applyCookies)(page, opts.cookieHeader, opts.appUrl);
    await (0, print_helpers_1.gotoAndWaitForContent)(page, opts.printUrl, WRAPPER_SELECTOR);
    await page.emulateMediaType("print");
    await (0, print_helpers_1.waitForFonts)(page);
    await (0, print_helpers_1.waitForImages)(page);
    await fixLayout(page);
    const rawPdf = await page.pdf({
        preferCSSPageSize: true,
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return embedPdfMetadata(Buffer.from(rawPdf), { title: opts.resumeTitle, author: opts.candidateName });
}
async function fixLayout(page) {
    await page.evaluate((pagePx, fudgePx, bottomMarginPx) => {
        const wrapper = document.querySelector(".resume-pages");
        if (!wrapper)
            return;
        const root = wrapper.firstElementChild;
        if (!root)
            return;
        const wrapperRect = wrapper.getBoundingClientRect();
        const children = Array.from(root.children);
        const zoom = parseFloat(root.style.zoom || "1") || 1;
        const isDiscretePages = children.length > 1 && children.every((c) => Math.abs(c.scrollHeight * zoom - pagePx) < pagePx * 0.15);
        if (!isDiscretePages) {
            // Sidebar gradient painter
            const layout = root.dataset.printLayout ?? "";
            const isSidebarLeft = layout === "sidebar-left";
            const isSidebarRight = layout === "sidebar-right";
            if (isSidebarLeft || isSidebarRight) {
                const sidebarColEl = isSidebarLeft
                    ? root.firstElementChild
                    : root.lastElementChild;
                const mainColEl = isSidebarLeft
                    ? root.lastElementChild
                    : root.firstElementChild;
                const sidebarSide = isSidebarLeft ? "left" : "right";
                if (sidebarColEl && mainColEl) {
                    const rootWidth = root.getBoundingClientRect().width;
                    const sidebarWidth = sidebarColEl.getBoundingClientRect().width;
                    const ratio = (sidebarWidth / rootWidth) * 100;
                    function isSolidBg(bg) {
                        return bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
                    }
                    function hasSolidBgDeep(el) {
                        const direct = window.getComputedStyle(el).backgroundColor;
                        if (isSolidBg(direct))
                            return direct;
                        for (const c1 of Array.from(el.children)) {
                            const bg1 = window.getComputedStyle(c1).backgroundColor;
                            if (isSolidBg(bg1))
                                return bg1;
                            for (const c2 of Array.from(c1.children)) {
                                const bg2 = window.getComputedStyle(c2).backgroundColor;
                                if (isSolidBg(bg2))
                                    return bg2;
                            }
                        }
                        return null;
                    }
                    const sidebarBg = hasSolidBgDeep(sidebarColEl);
                    if (sidebarBg) {
                        let mainBg = "white";
                        if (mainColEl) {
                            const direct = window.getComputedStyle(mainColEl).backgroundColor;
                            if (isSolidBg(direct)) {
                                mainBg = direct;
                            }
                            else {
                                outer: for (const c1 of Array.from(mainColEl.children)) {
                                    const bg1 = window.getComputedStyle(c1).backgroundColor;
                                    if (isSolidBg(bg1)) {
                                        mainBg = bg1;
                                        break;
                                    }
                                    for (const c2 of Array.from(c1.children)) {
                                        const bg2 = window.getComputedStyle(c2).backgroundColor;
                                        if (isSolidBg(bg2)) {
                                            mainBg = bg2;
                                            break outer;
                                        }
                                    }
                                }
                            }
                        }
                        const gradient = sidebarSide === "left"
                            ? `linear-gradient(to right, ${sidebarBg} 0%, ${sidebarBg} ${ratio}%, ${mainBg} ${ratio}%, ${mainBg} 100%)`
                            : `linear-gradient(to left, ${sidebarBg} 0%, ${sidebarBg} ${100 - ratio}%, ${mainBg} ${100 - ratio}%, ${mainBg} 100%)`;
                        root.style.setProperty("background", gradient, "important");
                    }
                }
            }
            const effectivePagePx = pagePx - bottomMarginPx;
            const contentBottomPx = root.scrollHeight * zoom - fudgePx;
            const layout2 = root.dataset.printLayout ?? "";
            const isSidebarLeft2 = layout2 === "sidebar-left";
            const isSidebarRight2 = layout2 === "sidebar-right";
            const mainColEl2 = isSidebarLeft2
                ? root.lastElementChild
                : isSidebarRight2
                    ? root.firstElementChild
                    : root;
            const sidebarColEl2 = isSidebarLeft2
                ? root.firstElementChild
                : isSidebarRight2
                    ? root.lastElementChild
                    : null;
            const cols = [];
            for (const colEl of [mainColEl2, sidebarColEl2].filter(Boolean)) {
                const pt = parseFloat(window.getComputedStyle(colEl).paddingTop) || 0;
                if (pt > 0)
                    cols.push({ el: colEl, paddingPx: pt });
            }
            const numPagesApprox = Math.ceil(contentBottomPx / effectivePagePx);
            root.querySelectorAll("[data-pdf-spacer]").forEach((s) => s.remove());
            for (const { el: col, paddingPx } of cols) {
                const colRect = col.getBoundingClientRect();
                const colCenterX = colRect.left + colRect.width / 2;
                for (let pN = numPagesApprox - 1; pN >= 1; pN--) {
                    const boundaryY = wrapperRect.top + pN * effectivePagePx;
                    const hit = document.elementFromPoint(colCenterX, boundaryY);
                    if (!hit || !col.contains(hit))
                        continue;
                    let ancestor = hit;
                    while (ancestor.parentElement && ancestor.parentElement !== col) {
                        ancestor = ancestor.parentElement;
                    }
                    if (ancestor === col)
                        continue;
                    if (ancestor.dataset.pdfSpacer)
                        continue;
                    const gap = parseFloat(window.getComputedStyle(ancestor.parentElement ?? col).gap) || 0;
                    const spacerH = Math.max(0, paddingPx - gap);
                    if (spacerH <= 0)
                        continue;
                    const spacer = document.createElement("div");
                    spacer.dataset.pdfSpacer = "true";
                    spacer.style.cssText = `height:${spacerH}px;flex-shrink:0;`;
                    col.insertBefore(spacer, ancestor);
                }
            }
            const numPages = Math.ceil(contentBottomPx / effectivePagePx);
            if (numPages <= 1)
                return;
            const lastFill = (contentBottomPx - (numPages - 1) * effectivePagePx) / effectivePagePx;
            if (lastFill < 0.05) {
                const trimPx = ((numPages - 1) * effectivePagePx) / zoom;
                root.style.setProperty("height", `${trimPx}px`, "important");
                root.style.setProperty("min-height", "0", "important");
                root.style.setProperty("overflow", "hidden", "important");
            }
            else {
                const snapPx = (numPages * effectivePagePx) / zoom;
                const finalTarget = Math.max(snapPx, root.scrollHeight);
                root.style.setProperty("height", `${finalTarget}px`, "important");
                root.style.setProperty("min-height", `${finalTarget}px`, "important");
                root.style.setProperty("overflow", "hidden", "important");
            }
        }
        else {
            const lastDiv = children[children.length - 1];
            const lastH = lastDiv.scrollHeight * zoom - fudgePx;
            if (lastH / pagePx < 0.15) {
                lastDiv.style.setProperty("display", "none", "important");
            }
        }
        const eff = pagePx - bottomMarginPx;
        const candidates = Array.from(wrapper.querySelectorAll(".resume-entry, .resume-section-title, h1, h2, h3, h4"));
        const fixes = [];
        candidates.forEach((el) => {
            if (el.dataset.pdfSpacer)
                return;
            const r = el.getBoundingClientRect();
            const topInWrapper = (r.top - wrapperRect.top) * zoom;
            const offsetInPage = topInWrapper % eff;
            if (offsetInPage > 0 && offsetInPage < 8)
                fixes.push(el);
        });
        fixes.forEach((el) => el.style.setProperty("margin-top", "0", "important"));
    }, constants_1.USABLE_PX_PER_PAGE, constants_1.FUDGE_PX, constants_1.PDF_BOTTOM_MARGIN_PX);
}
async function embedPdfMetadata(pdfBuffer, meta) {
    try {
        const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBuffer);
        if (meta.title)
            pdfDoc.setTitle(meta.title);
        if (meta.author)
            pdfDoc.setAuthor(meta.author);
        pdfDoc.setProducer("ReadyCV");
        pdfDoc.setCreator("ReadyCV — readycvv.com");
        pdfDoc.setCreationDate(new Date());
        const bytes = await pdfDoc.save();
        return Buffer.from(bytes);
    }
    catch {
        return pdfBuffer;
    }
}
