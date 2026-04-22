import RegisterForm from "@/components/auth/RegisterForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Crear Cuenta Gratis",
  description:
    "Regístrate gratis en READY CV y empieza a crear tu currículum vitae profesional hoy. Sin tarjeta de crédito, sin compromisos.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://readycv.app/register",
  },
}

export default function RegisterPage() {
  return <RegisterForm />
}
