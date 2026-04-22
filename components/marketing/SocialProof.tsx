import { Star } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function SocialProof() {
  const t = await getTranslations("social_proof")

  const testimonials = [
    {
      name: t("testimonial1_name"),
      role: t("testimonial1_role"),
      rating: 5,
      text: t("testimonial1_text"),
    },
    {
      name: t("testimonial2_name"),
      role: t("testimonial2_role"),
      rating: 5,
      text: t("testimonial2_text"),
    },
    {
      name: t("testimonial3_name"),
      role: t("testimonial3_role"),
      rating: 4,
      text: t("testimonial3_text"),
    },
  ]

  return (
    <section className="py-20 px-4 bg-[#eaf3fc]">
      <div className="max-w-5xl mx-auto text-center">
        <div className="flex items-center justify-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-4xl font-bold mb-1">{t("rating")}</p>
        <p className="text-muted-foreground mb-12">{t("based_on")}</p>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, rating, text }) => (
            <div key={name} className="bg-white rounded-2xl p-6 text-left shadow-sm border border-border">
              <div className="flex mb-3">
                {[...Array(rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-foreground mb-4 leading-relaxed">&quot;{text}&quot;</p>
              <div>
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
