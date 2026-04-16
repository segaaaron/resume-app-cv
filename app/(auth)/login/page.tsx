import LoginForm from "@/components/auth/LoginForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Iniciar sesión — CVV Pro",
}

export default function LoginPage() {
  return <LoginForm />
}
