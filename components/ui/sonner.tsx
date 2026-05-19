"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useMemo } from "react"

const LABELS = {
  es: { success: "Éxito", error: "Error", warning: "Advertencia", info: "Info", loading: "Cargando" },
  en: { success: "Success", error: "Error", warning: "Warning", info: "Info", loading: "Loading" },
}

const labelStyle = (color: string): React.CSSProperties => ({
  fontWeight: 700,
  fontSize: "12px",
  color,
  whiteSpace: "nowrap",
  flexShrink: 0,
})

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  const labels = useMemo(() => {
    const lang = typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "es"
    return LABELS[lang]
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={2000}
      expand={true}
      closeButton={false}
      icons={{
        success: <span style={labelStyle("#166534")}>{labels.success}:</span>,
        error: <span style={labelStyle("#991b1b")}>{labels.error}:</span>,
        warning: <span style={labelStyle("#854d0e")}>{labels.warning}:</span>,
        info: <span style={labelStyle("#1e40af")}>{labels.info}:</span>,
        loading: <span style={labelStyle("#4b5563")}>{labels.loading}:</span>,
      }}
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border !shadow-sm !text-sm !font-medium !px-4 !py-3 !gap-2 !items-center",
          icon: "!w-auto !h-auto !mr-2",
          title: "!font-normal !text-[13px]",
          description: "!text-xs !opacity-80",
          success: "!bg-green-100 !text-green-800 !border-green-200",
          error: "!bg-red-100 !text-red-800 !border-red-200",
          warning: "!bg-yellow-100 !text-yellow-800 !border-yellow-200",
          info: "!bg-blue-100 !text-blue-800 !border-blue-200",
          loading: "!bg-gray-100 !text-gray-700 !border-gray-200",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
