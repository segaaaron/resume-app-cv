import LoginForm from "@/components/auth/LoginForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description: "Accede a tu cuenta de READY CV para continuar creando y editando tu currículum vitae profesional.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://readycvv.com/login",
  },
}

export default function LoginPage() {
  return <LoginForm />
}
