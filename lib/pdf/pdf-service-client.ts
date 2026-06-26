// web app — API contract with pdf-generator microservice (services/pdf-generator).
// These fields are consumed by generate-pdf.route.ts in the microservice.
// If fields change here, update the microservice route in sync.

// Simple async semaphore — no external deps
type QueueEntry = { cancelled: boolean; acquire: () => void }

let activePdfRequests = 0
// Aligns with the PDF microservice MAX_CONCURRENT_PAGES (6) plus a small queue
// headroom. Tunable via env so it can track the service's capacity without a redeploy.
const PDF_CONCURRENCY_LIMIT = Math.max(1, Number(process.env.PDF_CONCURRENCY_LIMIT ?? 8))
const pdfQueue: QueueEntry[] = []

function acquirePdfSlot(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (activePdfRequests < PDF_CONCURRENCY_LIMIT) {
      activePdfRequests++
      resolve()
      return
    }
    const entry: QueueEntry = {
      cancelled: false,
      acquire: () => { activePdfRequests++; resolve() },
    }
    pdfQueue.push(entry)
    const timer = setTimeout(() => {
      entry.cancelled = true
      reject(new Error("pdf_queue_timeout: PDF service queue full or stalled"))
    }, 30_000)
    // Ensure timer doesn't keep process alive
    if (typeof timer === "object" && "unref" in timer) (timer as NodeJS.Timeout).unref()
  })
}

function releasePdfSlot(): void {
  // Skip cancelled entries (timed-out waiters) until we find a live one
  while (pdfQueue.length > 0) {
    const entry = pdfQueue.shift()!
    if (!entry.cancelled) {
      entry.acquire()
      return
    }
    // entry was cancelled: don't increment activePdfRequests, just discard it
  }
  // No live waiters — decrement normally
  activePdfRequests--
}

export type PdfServiceOpts = {
  printUrl: string
  cookies: string
  stretchPages: boolean  // true = resume renderer | false = cover-letter renderer
  candidateName?: string
  resumeTitle?: string
  letterTitle?: string
}

type FetchError = Error & { status?: number }

async function callOnce(opts: PdfServiceOpts, signal: AbortSignal): Promise<Buffer> {
  const serviceUrl = process.env.PDF_SERVICE_URL
  const secret = process.env.PDF_SERVICE_SECRET

  if (!serviceUrl || !secret) {
    throw new Error("PDF_SERVICE_URL and PDF_SERVICE_SECRET must be set")
  }

  const res = await fetch(`${serviceUrl}/generate-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(opts),
    signal,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>
    const detail = body.detail ? ` — ${body.detail}` : ""
    const err = new Error(`PDF service ${res.status}: ${body.error ?? "unknown"}${detail}`) as FetchError
    err.status = res.status
    throw err
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function callScreenshotService(printUrl: string, cookies: string): Promise<Buffer> {
  const serviceUrl = process.env.PDF_SERVICE_URL
  const secret = process.env.PDF_SERVICE_SECRET

  if (!serviceUrl || !secret) {
    throw new Error("PDF_SERVICE_URL and PDF_SERVICE_SECRET must be set")
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(`${serviceUrl}/generate-screenshot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ printUrl, cookies }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, string>
      throw new Error(`Screenshot service ${res.status}: ${body.error ?? "unknown"}`)
    }

    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } finally {
    clearTimeout(timeout)
  }
}

async function callPdfServiceInternal(opts: PdfServiceOpts): Promise<Buffer> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    return await callOnce(opts, controller.signal)
  } catch (firstErr: unknown) {
    const isRetryable =
      firstErr instanceof Error &&
      (firstErr.name === "AbortError" ||
        ((firstErr as FetchError).status !== undefined && (firstErr as FetchError).status! >= 500))

    if (!isRetryable) throw firstErr

    // 1 retry after 1s
    await new Promise((r) => setTimeout(r, 1_000))
    const controller2 = new AbortController()
    const timeout2 = setTimeout(() => controller2.abort(), 30_000)
    try {
      return await callOnce(opts, controller2.signal)
    } finally {
      clearTimeout(timeout2)
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function callPdfService(opts: PdfServiceOpts): Promise<Buffer> {
  await acquirePdfSlot()
  try {
    return await callPdfServiceInternal(opts)
  } finally {
    releasePdfSlot()
  }
}
