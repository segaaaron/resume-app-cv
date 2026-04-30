---
name: CVV Pro domain and SEO infrastructure
description: Correct domain is readycvv.com (not readycv.app). Sitemap, robots, canonicals, and JSON-LD all updated. Sitelinks SearchBox and BreadcrumbList implemented.
type: project
---

The production domain is **readycvv.com** — NOT readycv.app. All canonical URLs, OG tags, JSON-LD schema, sitemap, and robots.txt must use readycvv.com.

**Why:** readycv.app was the original dev domain. readycvv.com is the live production domain verified with Resend (DKIM/SPF/DMARC). Using the wrong domain in canonicals causes Google to index the wrong URLs.

**How to apply:** Any time a new page or route is created, hardcode `https://readycvv.com` in canonical/OG metadata. No env var — the domain is stable.

## SEO infrastructure state (as of 2026-04-29)

### JSON-LD on homepage (app/[locale]/page.tsx)
- `WebApplication` schema: name, url, offers ($15/mo), featureList (8 items), aggregateRating
- `WebSite` schema with `SearchAction` potentialAction (targets `/templates?q=`)
- `SiteLinksSearchBox` schema — signals Google to show sitelinks search in SERP

### BreadcrumbList schema
- Pricing page (`app/[locale]/pricing/page.tsx`): Inicio > Precios
- Templates page (`app/[locale]/templates/page.tsx`): Inicio > Plantillas de CV

### Sitemap priorities (app/sitemap.ts)
- / → 1.0
- /pricing → 0.9
- /templates → 0.8
- /register → 0.8
- /login → 0.7
- /blog → 0.6
- /pro-disenos → 0.5
- /privacy, /terms → 0.2

### robots.ts
- Allows all crawlers on public pages
- Disallows: /dashboard/, /editor/, /api/, /resume/, /cover-letter/
