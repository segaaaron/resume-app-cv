import Script from "next/script"

type FaqItem = { q: string; a: string }

type Props = {
  locale: string
  slug: string
  title: string
  description: string
  datePublished: string
  dateModified: string
  faqs?: FaqItem[]
  breadcrumbBlogLabel: string
  keywords?: string[]
}

/**
 * Premium blog schemas — Article + FAQPage + BreadcrumbList
 * Pure JSON-LD via next/script. Print-safe (no DOM impact).
 */
export default function BlogSchemas({
  locale,
  slug,
  title,
  description,
  datePublished,
  dateModified,
  faqs,
  breadcrumbBlogLabel,
  keywords = [],
}: Props) {
  const baseUrl = "https://www.valhallaresume.com"
  const canonical = `${baseUrl}/${locale}/blog/${slug}`

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: `${baseUrl}/og-image.png`,
    datePublished,
    dateModified,
    author: {
      "@type": "Organization",
      name: "Valhalla Resume Team",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Valhalla Resume",
      logo: { "@type": "ImageObject", url: `${baseUrl}/og-image.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    inLanguage: locale,
    keywords,
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: breadcrumbBlogLabel, item: `${baseUrl}/${locale}/blog` },
      { "@type": "ListItem", position: 3, name: title, item: canonical },
    ],
  }

  const faqSchema = faqs && faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }
    : null

  return (
    <>
      <Script
        id={`article-jsonld-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Script
        id={`breadcrumb-jsonld-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <Script
          id={`faq-jsonld-${slug}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  )
}
