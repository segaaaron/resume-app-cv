import RegisterForm from "@/components/auth/RegisterForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Crear tu cuenta — READY CV",
  description:
    "Regístrate en READY CV y empieza a crear tu currículum vitae profesional hoy.",
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
