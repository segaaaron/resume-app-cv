import { toast } from "sonner"

const MESSAGES = {
  es: {
    server_error: "Ocurrió un problema en el servidor. Por favor intenta de nuevo en unos momentos.",
    service_unavailable: "El servicio está temporalmente no disponible. Intenta en unos minutos.",
    network_error: "Sin conexión a internet. Verifica tu red e intenta de nuevo.",
  },
  en: {
    server_error: "A server error occurred. Please try again in a moment.",
    service_unavailable: "The service is temporarily unavailable. Try again in a few minutes.",
    network_error: "No internet connection. Check your network and try again.",
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
