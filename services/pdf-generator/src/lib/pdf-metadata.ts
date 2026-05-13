// pdf-generator microservice only
import { PDFDocument } from "pdf-lib"
import { PDF_PRODUCER, PDF_CREATOR } from "../constants"

/** Metadata to embed into the generated PDF document. */
export interface PdfMeta {
  title?: string
  author?: string
}

/**
 * Embeds title, author, producer, and creator metadata into a PDF buffer.
 * Falls back to the original buffer if pdf-lib fails to parse or save.
 */
export async function embedPdfMetadata(pdfBuffer: Buffer, meta: PdfMeta): Promise<Buffer> {
  try {
    const doc = await PDFDocument.load(pdfBuffer)
    if (meta.title) doc.setTitle(meta.title)
    if (meta.author) doc.setAuthor(meta.author)
    doc.setProducer(PDF_PRODUCER)
    doc.setCreator(PDF_CREATOR)
    doc.setCreationDate(new Date())
    return Buffer.from(await doc.save())
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[pdf-metadata] Failed to embed metadata — returning raw buffer. Reason: ${msg}`)
    return pdfBuffer
  }
}
