// lib/ats/skill-catalog.ts
// The skill autocomplete's data + search core (pure, testable). Turns the ATS
// dictionary into display-cased, categorised options and filters them for a
// query: prefix matches first, then substring, then a fuzzy "did you mean" for
// typos. Kept out of the component so the casing and ranking can be tested.
import { ATS_SKILLS } from "@/lib/ats/skills-dictionary"
import { normalizeTerm } from "@/lib/ats/vocabulary"
import { normalizedSimilarity } from "@/lib/services/ai/shared/text-similarity"

// Canonical casing for acronyms/brands the title-case fallback gets wrong
// ("aws certified" → "AWS Certified", "b2b" → "B2B", "bamboohr" → "BambooHR").
const CASE_OVERRIDE: Record<string, string> = {
  javascript: "JavaScript", typescript: "TypeScript", "node.js": "Node.js", nodejs: "Node.js",
  "ci/cd": "CI/CD", html: "HTML", css: "CSS", sql: "SQL", nosql: "NoSQL", aws: "AWS", gcp: "GCP",
  ios: "iOS", macos: "macOS", graphql: "GraphQL", github: "GitHub", gitlab: "GitLab",
  postgresql: "PostgreSQL", mongodb: "MongoDB", mysql: "MySQL", php: "PHP", api: "API", apis: "APIs",
  rest: "REST", "rest api": "REST API", "restful apis": "RESTful APIs", ui: "UI", ux: "UX",
  "ui/ux": "UI/UX", seo: "SEO", sem: "SEM", "c#": "C#", "c++": "C++", devops: "DevOps",
  mlops: "MLOps", saas: "SaaS", b2b: "B2B", b2c: "B2C", "b2b sales": "B2B Sales",
  "b2c sales": "B2C Sales", "adobe xd": "Adobe XD", "after effects": "After Effects",
  bamboohr: "BambooHR", bigquery: "BigQuery", "aws certified": "AWS Certified",
  "azure certified": "Azure Certified", "gcp certified": "GCP Certified", "react native": "React Native",
  "next.js": "Next.js", nextjs: "Next.js", "vue.js": "Vue.js", "d3.js": "D3.js", "express.js": "Express.js",
  jira: "Jira", hubspot: "HubSpot", salesforce: "Salesforce", wordpress: "WordPress",
  quickbooks: "QuickBooks", tensorflow: "TensorFlow", pytorch: "PyTorch", "power bi": "Power BI",
  jwt: "JWT", oauth: "OAuth", oauth2: "OAuth2", saml: "SAML", grpc: "gRPC", kpi: "KPI", kpis: "KPIs",
  crm: "CRM", erp: "ERP", etl: "ETL", "a/b testing": "A/B Testing", "async/await": "Async/Await",
  swiftui: "SwiftUI", uikit: "UIKit", xctest: "XCTest", "objective-c": "Objective-C",
  ".net": ".NET", dotnet: ".NET", "asp.net": "ASP.NET",
  // 2026 batch casing
  rxjs: "RxJS", rxswift: "RxSwift", "three.js": "Three.js", threejs: "Three.js",
  jquery: "jQuery", mobx: "MobX", "material ui": "Material UI", mui: "MUI", "chakra ui": "Chakra UI",
  langchain: "LangChain", mlflow: "MLflow", powerbi: "Power BI", dbt: "dbt",
  argocd: "ArgoCD", "argo cd": "ArgoCD", "vs code": "VS Code", vscode: "VS Code", intellij: "IntelliJ",
  sonarqube: "SonarQube", "cosmos db": "Cosmos DB", cosmosdb: "Cosmos DB", powershell: "PowerShell",
  "socket.io": "Socket.IO", opencv: "OpenCV", openshift: "OpenShift", circleci: "CircleCI",
  "circle ci": "CircleCI", opentelemetry: "OpenTelemetry", mariadb: "MariaDB", neo4j: "Neo4j",
  "hugging face": "Hugging Face", huggingface: "Hugging Face", rag: "RAG", swagger: "Swagger",
  openapi: "OpenAPI", invision: "InVision", "google tag manager": "Google Tag Manager", gtm: "GTM",
  "apache hive": "Apache Hive", "apache flink": "Apache Flink", semrush: "SEMrush",
  // Native-dev tooling casing
  "swift package manager": "Swift Package Manager", swiftpm: "SwiftPM", spm: "SPM",
  xcode: "Xcode", "core ml": "Core ML", coreml: "Core ML", arkit: "ARKit",
  avfoundation: "AVFoundation", widgetkit: "WidgetKit", storekit: "StoreKit", mapkit: "MapKit",
  cloudkit: "CloudKit", snapkit: "SnapKit", swiftlint: "SwiftLint", testflight: "TestFlight",
  "android sdk": "Android SDK", livedata: "LiveData", viewmodel: "ViewModel",
  workmanager: "WorkManager", exoplayer: "ExoPlayer", mvi: "MVI", sqlalchemy: "SQLAlchemy",
  typeorm: "TypeORM", ktor: "Ktor", npm: "npm", pnpm: "pnpm", cmake: "CMake", protobuf: "Protobuf",
  // 2026-08 coverage batch casing (iOS/Android/web/cloud/security/QA)
  healthkit: "HealthKit", homekit: "HomeKit", sirikit: "SiriKit", watchkit: "WatchKit",
  swiftdata: "SwiftData", xcuitest: "XCUITest", xcframework: "XCFramework",
  tvos: "tvOS", ipados: "iPadOS", visionos: "visionOS", urlsession: "URLSession",
  "metal api": "Metal API", "in-app purchases": "In-App Purchases",
  "room database": "Room Database", okhttp: "OkHttp",
  rxjava: "RxJava", proguard: "ProGuard", "android ndk": "Android NDK", gson: "Gson",
  moshi: "Moshi", leakcanary: "LeakCanary", "model view presenter": "Model View Presenter (MVP)", mvc: "MVC",
  ".net maui": ".NET MAUI", solidjs: "SolidJS", "rollup.js": "Rollup.js", trpc: "tRPC",
  "styled-components": "styled-components", esbuild: "esbuild",
  "apollo graphql": "Apollo GraphQL", webassembly: "WebAssembly", wcag: "WCAG",
  "progressive web apps": "Progressive Web Apps", "asp.net core": "ASP.NET Core",
  "amazon rds": "Amazon RDS", "gitlab ci": "GitLab CI", clickhouse: "ClickHouse",
  "amazon redshift": "Amazon Redshift", "large language models": "Large Language Models",
  owasp: "OWASP", siem: "SIEM", gdpr: "GDPR", "iso 27001": "ISO 27001", "ssl/tls": "SSL/TLS",
  k6: "k6", jmeter: "JMeter", tdd: "TDD", bdd: "BDD", testrail: "TestRail",
  "grand central dispatch": "Grand Central Dispatch",
  // Healthcare / education / legal / trades casing
  ehr: "EHR", emr: "EMR", cpr: "CPR", bls: "BLS", acls: "ACLS", pals: "PALS", hipaa: "HIPAA",
  ekg: "EKG", ecg: "ECG", "icd-10": "ICD-10", "cpt coding": "CPT Coding", "iv therapy": "IV Therapy",
  iep: "IEP", "canvas lms": "Canvas LMS", lexisnexis: "LexisNexis", "e-discovery": "E-Discovery",
  "e-learning": "E-Learning", cnc: "CNC", "cnc machining": "CNC Machining", hvac: "HVAC",
  osha: "OSHA", servsafe: "ServSafe", "pos systems": "POS Systems", "cinema 4d": "Cinema 4D",
  c4d: "Cinema 4D", coreldraw: "CorelDRAW", "3d modeling": "3D Modeling",
  // 2026-08 agile/product/design/backend batch. Brand and acronym casing that the
  // title-caser cannot infer: it produced "Adobe Indesign", "Api Gateway", "Mvp
  // Definition" and "Jetpack Datastore", and those strings are what the chip
  // writes into the user's CV.
  "adobe indesign": "Adobe InDesign", "adobe after effects": "Adobe After Effects",
  "adobe lightroom": "Adobe Lightroom", "api gateway": "API Gateway",
  "mvp definition": "MVP Definition", "jetpack datastore": "Jetpack DataStore",
  "azure devops": "Azure DevOps", "product requirements document": "Product Requirements Document (PRD)",
  "rice prioritization": "RICE Prioritization", "moscow prioritization": "MoSCoW Prioritization",
  "scaled agile framework": "Scaled Agile Framework (SAFe)", "go-to-market": "Go-to-Market",
  "the composable architecture": "The Composable Architecture (TCA)",
  "server-sent events": "Server-Sent Events (SSE)", "definition of done": "Definition of Done",
  "definition of ready": "Definition of Ready", "north star metric": "North Star Metric",
  "voiceover accessibility": "VoiceOver Accessibility", "qa manual": "Manual Testing",
  "event-driven architecture": "Event-Driven Architecture",
  "ceremonias agiles": "Ceremonias Ágiles", "cross-functional teams": "Cross-Functional Teams",
  // 2026-08 non-tech batch. Acronyms the title-caser mangles into "Iv Insertion"
  // and "Tig Welding" — and this string is what the chip writes into the CV of a
  // nurse or a welder, in front of the recruiter who knows how it is spelled.
  "iv insertion": "IV Insertion", "tig welding": "TIG Welding", "mig welding": "MIG Welding",
  "iep development": "IEP Development", "plc programming": "PLC Programming",
  rtos: "RTOS", "pcb design": "PCB Design", "can bus": "CAN Bus", "i2c protocol": "I2C Protocol",
  "5s methodology": "5S Methodology", "warehouse management system": "Warehouse Management System (WMS)",
  "net promoter score": "Net Promoter Score (NPS)", "embedded c": "Embedded C",
  "lockout tagout": "Lockout/Tagout", "learning management systems": "Learning Management Systems (LMS)",
  "mergers and acquisitions": "Mergers & Acquisitions", "discounted cash flow": "Discounted Cash Flow (DCF)",
  "applicant tracking systems": "Applicant Tracking Systems (ATS)",
  "diversity and inclusion": "Diversity & Inclusion", "elk stack": "ELK Stack",
  "public key infrastructure": "Public Key Infrastructure (PKI)", "pci dss": "PCI DSS",
  "nist framework": "NIST Framework", "soc 2": "SOC 2",
  "service level agreement": "Service Level Agreement (SLA)",
  "service level objectives": "Service Level Objectives (SLO)",
  "infrastructure as code": "Infrastructure as Code (IaC)", "css grid": "CSS Grid",
  "css modules": "CSS Modules", "server-side rendering": "Server-Side Rendering (SSR)",
  "static site generation": "Static Site Generation (SSG)", "ssr hydration": "SSR Hydration",
  "web vitals": "Core Web Vitals", "camerax": "CameraX", "media3": "Media3",
  "kotlin symbol processing": "Kotlin Symbol Processing (KSP)", "mockk": "MockK",
  "wear os": "Wear OS", "android tv": "Android TV", "android auto": "Android Auto",
  "android app bundles": "Android App Bundles", "core nfc": "Core NFC", "core image": "Core Image",
  "core audio": "Core Audio", "core text": "Core Text", "core spotlight": "Core Spotlight",
  "objective-c runtime": "Objective-C Runtime", "swift actors": "Swift Actors",
  "mobile device management": "Mobile Device Management (MDM)", "apple handoff": "Apple Handoff",
  "presto sql": "Presto SQL", "amazon kinesis": "Amazon Kinesis", "delta lake": "Delta Lake",
  "slowly changing dimensions": "Slowly Changing Dimensions (SCD)",
  "master data management": "Master Data Management (MDM)",
  "spin selling": "SPIN Selling", "lead qualification": "Lead Qualification (BANT/MEDDIC)",
  "key account management": "Key Account Management (KAM)",
}

export function displaySkill(term: string): string {
  const o = CASE_OVERRIDE[term.toLowerCase().trim()]
  if (o) return o
  // Unicode-aware: \b\w treats "ó" as a non-word character, so the ASCII regex
  // title-cased the letter AFTER the accent — "atención al paciente" came back
  // as "AtencióN Al Paciente", and the ATS "add skill" button wrote that into
  // the CV. Only the first letter of each word is touched.
  const SMALL = new Set(["de", "del", "al", "la", "el", "los", "las", "y", "en", "por", "para", "con",
    "of", "and", "the", "a", "an", "for", "in", "on", "to", "as", "with"])
  return term
    .split(" ")
    .map((w, i) => (i > 0 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : w.replace(/(^|[\-/(])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase())))
    .join(" ")
}

const CATEGORY_LABEL: Record<string, string> = {
  lang: "Language", frontend: "Frontend", backend: "Backend", mobile: "Mobile", data: "Data",
  db: "Database", cloud: "Cloud", devops: "DevOps", design: "Design", pm: "Project Mgmt",
  marketing: "Marketing", sales: "Sales", finance: "Finance", hr: "HR", soft: "Soft skill",
  tools: "Tool", cert: "Certification", industry: "Industry",
  healthcare: "Healthcare", education: "Education", legal: "Legal", operations: "Operations",
}

export interface SkillOption {
  display: string
  norm: string
  category: string
  categoryLabel: string
  /**
   * The entry's other spellings, normalized. Searchable but never shown: a user
   * types the acronym far more often than the canonical name ("PWA", "GCD",
   * "SRE", "pentesting"), and without this the dropdown answered nothing and
   * the skill looked absent from the catalog.
   */
  aliases: readonly string[]
}

/** All dictionary skills as display-cased, categorised, alphabetically-sorted options. */
export const SKILL_CATALOG: SkillOption[] = (() => {
  const seen = new Set<string>()
  const out: SkillOption[] = []
  for (const s of ATS_SKILLS) {
    const norm = normalizeTerm(s.term)
    if (!norm || seen.has(norm)) continue
    seen.add(norm)
    const aliases = (s.aliases ?? []).map(normalizeTerm).filter((a) => a && a !== norm)
    out.push({ display: displaySkill(s.term), norm, category: s.category, categoryLabel: CATEGORY_LABEL[s.category] ?? s.category, aliases })
  }
  return out.sort((a, b) => a.display.localeCompare(b.display))
})()

// Aliases included: a CV written in Spanish lists "atención al paciente", and a
// category of null there left the field-boost blind to that user's whole field.
const NORM_TO_CATEGORY = new Map(
  SKILL_CATALOG.flatMap((o) => [o.norm, ...o.aliases].map((f) => [f, o.category] as const)),
)

/** The dictionary category of a skill name, or null if not recognised. */
export function categoryOfSkill(name: string): string | null {
  return NORM_TO_CATEGORY.get(normalizeTerm(name)) ?? null
}

// Same index, pointing at the display form instead of the category. Aliases
// included, which is the whole point: "reactjs" and "react.js" both land on
// "React".
const NORM_TO_DISPLAY = new Map(
  SKILL_CATALOG.flatMap((o) => [o.norm, ...o.aliases].map((f) => [f, o.display] as const)),
)

/**
 * The catalog's spelling of a skill, or null when it does not know it.
 *
 * This is taxonomy alignment, which is what an ATS does to the résumé anyway:
 * synonyms and variants collapse onto one canonical form. Modern parsers have an
 * LLM layer that treats "React", "React.js" and "ReactJS" as the same thing;
 * older ones still token-match literal strings and score only the exact form. So
 * writing the canonical name costs nothing on the systems that are clever and
 * wins on the ones that are not.
 *
 * A skill the catalog does not carry comes back null on purpose — the caller
 * keeps what it had. 1,002 curated terms do not cover every trade, and dropping
 * an unknown skill would be the same mistake as the filter that once left the
 * suggestion list able to echo only what the user had already typed.
 */
export function canonicalSkillName(name: string): string | null {
  const norm = normalizeTerm(name)
  const display = NORM_TO_DISPLAY.get(norm)
  if (!display) return null

  const target = normalizeTerm(display)

  // Identical but for casing and punctuation: "git" → "Git", "rest apis" →
  // "REST APIs". Always safe.
  if (norm === target) return display

  // Otherwise only a ONE-WORD variant of a one-word name: "reactjs" → "React",
  // "postgres" → "PostgreSQL". Two rules learned the hard way, both caught by
  // tests rather than by review:
  //
  //  · Aliases carry the translations, so matching on any alias rewrote "Manejo
  //    de Efectivo" to "Cash Handling" — an English skills section on a Spanish
  //    CV, since every display form here is English.
  //  · "REST APIs" is an alias of the "REST" entry, so a loose substring rule
  //    shortened it and threw away the half that a posting actually says.
  //
  // Requiring both sides to be a single word rules out both: a translation is
  // never one word matching one word, and a phrase is never collapsed to its
  // first term.
  const oneWord = !norm.includes(" ") && !target.includes(" ")
  const variant = oneWord && (norm.startsWith(target) || target.startsWith(norm))
  return variant ? display : null
}

const FUZZY_THRESHOLD = 0.72

export interface SkillSearchResult {
  matches: SkillOption[]
  /** true when there was no direct match and these are typo suggestions. */
  fuzzy: boolean
}

/** Stable-partition: options whose category is boosted come first, order kept. */
function applyBoost(list: SkillOption[], boost: readonly string[]): SkillOption[] {
  if (boost.length === 0) return list
  const set = new Set(boost)
  const hit: SkillOption[] = []
  const rest: SkillOption[] = []
  for (const o of list) (set.has(o.category) ? hit : rest).push(o)
  return [...hit, ...rest]
}

/**
 * Filter the catalog for an autocomplete query. Direct matches (prefix ranked
 * above mid-string) come first; if there are none, fall back to fuzzy near-matches
 * (a typed typo like "graphq" → "GraphQL"). `boost` categories (inferred from the
 * user's field) float their skills to the top WITHIN each tier — a soft rank, never
 * a filter. Empty query → empty (dropdown closed).
 */
export function filterSkills(query: string, limit = 8, boost: readonly string[] = []): SkillSearchResult {
  const q = normalizeTerm(query)
  if (!q) return { matches: [], fuzzy: false }

  // The exact match leads, and it is NOT dropped as redundant: typing "swift"
  // used to return only "Swift Package Manager"/"SwiftUI", which reads as "Swift
  // itself is not in this list". It is also where the canonical casing comes
  // from — "uikit" typed, "UIKit" offered.
  let exact: SkillOption | null = null
  const prefix: SkillOption[] = []
  const contains: SkillOption[] = []
  for (const o of SKILL_CATALOG) {
    const forms = [o.norm, ...o.aliases]
    // Aliases answer exact/prefix only. Mid-string on an alias is noise —
    // "ios" sits inside "microservicios" and would offer Microservices.
    if (forms.some((f) => f === q)) exact = exact ?? o
    else if (forms.some((f) => f.startsWith(q))) prefix.push(o)
    else if (o.norm.includes(q)) contains.push(o)
  }
  const direct = [...(exact ? [exact] : []), ...applyBoost(prefix, boost), ...applyBoost(contains, boost)].slice(0, limit)
  if (direct.length > 0) return { matches: direct, fuzzy: false }

  // No substring hit → fuzzy "did you mean" for typos.
  const scored = SKILL_CATALOG
    .map((o) => ({ o, s: Math.max(...[o.norm, ...o.aliases].map((f) => normalizedSimilarity(q, f))) }))
    .filter((x) => x.s >= FUZZY_THRESHOLD)
    .sort((a, b) => b.s - a.s)
    .slice(0, Math.min(limit, 4))
    .map((x) => x.o)
  return { matches: scored, fuzzy: scored.length > 0 }
}
