import { PDFDocument } from "pdf-lib"
import type { Page } from "puppeteer-core"
import { applyCookies } from "../cookie-forwarder"
import { gotoAndWaitForContent, setA4Viewport, waitForFonts, waitForImages } from "../print-helpers"

const WRAPPER_SELECTOR = ".cover-letter-page"

export async function renderCoverLetterPdf(
  page: Page,
  opts: {
    printUrl: string
    cookieHeader: string
    appUrl: string
    candidateName?: string
    letterTitle?: string
  },
): Promise<Buffer> {
  await setA4Viewport(page)
  await applyCookies(page, opts.cookieHeader, opts.appUrl)
  await gotoAndWaitForContent(page, opts.printUrl, WRAPPER_SELECTOR)
  await page.emulateMediaType("print")
  await waitForFonts(page)
  await waitForImages(page)

  await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>(".cover-letter-page")
    if (!el) return
    el.style.setProperty("min-height", "0", "important")
    el.style.setProperty("height", "auto", "important")
  })

  const rawPdf = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  })

  return embedPdfMetadata(Buffer.from(rawPdf), { title: opts.letterTitle, author: opts.candidateName })
}

async function embedPdfMetadata(pdfBuffer: Buffer, meta: { title?: string; author?: string }): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    if (meta.title) pdfDoc.setTitle(meta.title)
    if (meta.author) pdfDoc.setAuthor(meta.author)
    pdfDoc.setProducer("ReadyCV")
    pdfDoc.setCreator("ReadyCV — readycvv.com")
    pdfDoc.setCreationDate(new Date())
    const bytes = await pdfDoc.save()
    return Buffer.from(bytes)
  } catch {
    return pdfBuffer
  }
}
