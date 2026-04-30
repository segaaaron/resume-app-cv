"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

type Status = "loading" | "success" | "invalid_token" | "token_expired" | "error"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<Status>("loading")

  useEffect(() => {
    if (!token) {
      setStatus("invalid_token")
      return
    }

    fetch(`/api/user/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.ok) {
          setStatus("success")
        } else {
          const data = await res.json().catch(() => ({}))
          setStatus((data.error as Status) ?? "error")
        }
      })
      .catch(() => setStatus("error"))
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900">Verificando tu email...</h1>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Email verificado</h1>
            <p className="text-gray-500 mb-6 text-sm">Tu cuenta está activa. Ya puedes usar todas las funciones de READY CV.</p>
            <Link
              href="/dashboard/resumes"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Ir al dashboard
            </Link>
          </>
        )}

        {status === "invalid_token" && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Enlace inválido</h1>
            <p className="text-gray-500 mb-6 text-sm">Este enlace de verificación no es válido o ya fue utilizado.</p>
            <Link
              href="/dashboard/resumes"
              className="inline-block text-blue-600 text-sm hover:underline"
            >
              Volver al dashboard
            </Link>
          </>
        )}

        {status === "token_expired" && (
          <>
            <XCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Enlace expirado</h1>
            <p className="text-gray-500 mb-6 text-sm">Este enlace de verificación expiró (válido por 24 horas). Regístrate de nuevo o contacta soporte.</p>
            <Link
              href="/dashboard/resumes"
              className="inline-block text-blue-600 text-sm hover:underline"
            >
              Volver al dashboard
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Error de verificación</h1>
            <p className="text-gray-500 mb-6 text-sm">Algo salió mal. Intenta de nuevo o contacta soporte.</p>
            <Link
              href="/dashboard/resumes"
              className="inline-block text-blue-600 text-sm hover:underline"
            >
              Volver al dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
