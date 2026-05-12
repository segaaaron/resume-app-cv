export type PdfServiceOpts = {
  printUrl: string
  cookies: string
  stretchPages: boolean
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
    const err = new Error(`PDF service ${res.status}: ${body.error ?? "unknown"}`) as FetchError
    err.status = res.status
    throw err
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function callPdfService(opts: PdfServiceOpts): Promise<Buffer> {
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
