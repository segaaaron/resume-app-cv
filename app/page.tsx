import { redirect } from "next/navigation"

// The middleware handles locale redirects, but this is a safety fallback
// for direct access to the root URL before middleware kicks in.
export default function RootPage() {
  redirect("/es")
}
