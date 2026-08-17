import Script from "next/script"
import { templateName, type TemplateSEO } from "@/lib/templates-seo"

interface Props {
  template: TemplateSEO
  locale: "en" | "es"
  url: string
  ogImage: string
  desc: string
  categoryLabel: string
  breadcrumbHomeLabel: string
  breadcrumbTemplatesLabel: string
  faqItems: Array<{ q: string; a: string }>
  baseUrl: string
}

export default function TemplateDetailSchemas({
  template,
  locale,
  url,
  ogImage,
  desc,
  categoryLabel,
  breadcrumbHomeLabel,
  breadcrumbTemplatesLabel,
  faqItems,
  baseUrl,
}: Props) {
  const isEs = locale === "es"

  // priceValidUntil: dinámico (hoy + 1 año)
  // Server Component emitting JSON-LD for crawlers: rendered on the server, never
  // hydrated. `priceValidUntil` has to be a real date relative to now.
  // eslint-disable-next-line react-hooks/purity
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  const name = templateName(template, locale)

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: isEs ? `Plantilla CV ${name}` : `${name} Resume Template`,
    description: desc,
    image: ogImage,
    brand: { "@type": "Brand", name: "Valhalla Resume" },
    category: categoryLabel,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: "15.00",
      priceValidUntil,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Valhalla Resume" },
    },
  }

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `Valhalla Resume ${name}`,
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    description: desc,
    offers: {
      "@type": "Offer",
      price: "15.00",
      priceCurrency: "USD",
    },
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: breadcrumbHomeLabel, item: `${baseUrl}/${locale}` },
      {
        "@type": "ListItem",
        position: 2,
        name: breadcrumbTemplatesLabel,
        item: `${baseUrl}/${locale}/templates`,
      },
      { "@type": "ListItem", position: 3, name, item: url },
    ],
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }

  return (
    <>
      <Script
        id="td-product-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <Script
        id="td-software-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }}
      />
      <Script
        id="td-breadcrumb-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Script
        id="td-faq-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </>
  )
}
