"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={2000}
      icons={{
        success: <CircleCheckIcon className="size-4 text-green-700" />,
        info: <InfoIcon className="size-4 text-blue-700" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-700" />,
        error: <OctagonXIcon className="size-4 text-red-700" />,
        loading: <Loader2Icon className="size-4 animate-spin text-gray-600" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border-2 !shadow-xl !text-sm !font-medium !px-4 !py-3 !gap-3",
          title: "!font-semibold !text-[13.5px]",
          description: "!text-xs !opacity-90",
          success:
            "!bg-green-50 !text-green-900 !border-green-700",
          error:
            "!bg-red-50 !text-red-900 !border-red-700",
          warning:
            "!bg-amber-50 !text-amber-900 !border-amber-700",
          info:
            "!bg-blue-50 !text-blue-900 !border-blue-700",
          loading:
            "!bg-white !text-gray-800 !border-gray-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
