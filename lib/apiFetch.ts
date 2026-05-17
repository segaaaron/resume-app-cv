import { toast } from "sonner"

const MESSAGES = {
  es: {
    server_error: "Algo salió mal. Inténtalo de nuevo.",
    service_unavailable: "Servicio no disponible. Intenta en unos minutos.",
    network_error: "Sin conexión. Verifica tu internet.",
  },
  en: {
    server_error: "Something went wrong. Please try again.",
    service_unavailable: "Service unavailable. Try again in a few minutes.",
    network_error: "No connection. Check your internet.",
  },
}

function getLocale(): "es" | "en" {
  if (typeof document === "undefined") return "es"
  return document.documentElement.lang === "en" ? "en" : "es"
}

type ApiFetchOptions = RequestInit & { silent?: boolean }

export async function apiFetch(url: string, options?: ApiFetchOptions): Promise<Response> {
  const { silent, ...fetchOptions } = options ?? {}
  const msgs = MESSAGES[getLocale()]
  let res: Response
  try {
    res = await fetch(url, fetchOptions)
  } catch {
    if (!silent) toast.error(msgs.network_error)
    throw new Error("network_error")
  }
  if (!silent && res.status >= 500) {
    toast.error(res.status === 503 ? msgs.service_unavailable : msgs.server_error)
  }
  return res
}
