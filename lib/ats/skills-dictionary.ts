/**
 * ATS Skills Dictionary
 * Curated ~250 skill keywords for keyword matching boost in ATS analyzer.
 * Bilingual where the term differs in Spanish; brand/tech names are universal.
 *
 * Each entry: canonical term (lowercase) + aliases (variants/translations).
 * Matching is case-insensitive on both sides.
 */

import { foldAccentsLower } from "@/lib/text/normalize";

export type SkillEntry = {
  term: string;
  aliases?: string[];
  category:
    | "lang"
    | "frontend"
    | "backend"
    | "mobile"
    | "data"
    | "cloud"
    | "devops"
    | "db"
    | "design"
    | "marketing"
    | "sales"
    | "pm"
    | "finance"
    | "hr"
    | "soft"
    | "industry"
    | "cert"
    | "tools"
    | "healthcare"
    | "education"
    | "legal"
    | "operations";
};

export const ATS_SKILLS: SkillEntry[] = [
  // Programming languages
  { term: "javascript", aliases: ["js"], category: "lang" },
  { term: "typescript", aliases: ["ts"], category: "lang" },
  { term: "python", category: "lang" },
  { term: "java", category: "lang" },
  { term: "c#", aliases: ["csharp", "c sharp"], category: "lang" },
  { term: "c++", aliases: ["cpp"], category: "lang" },
  { term: "go", aliases: ["golang"], category: "lang" },
  { term: "rust", category: "lang" },
  { term: "ruby", category: "lang" },
  { term: "php", category: "lang" },
  { term: "swift", category: "lang" },
  { term: "kotlin", category: "lang" },
  { term: "scala", category: "lang" },
  { term: "r", category: "lang" },
  { term: "matlab", category: "lang" },
  { term: "sql", category: "lang" },
  { term: "bash", aliases: ["shell scripting"], category: "lang" },
  { term: "html", category: "lang" },
  { term: "css", category: "lang" },
  { term: "dart", category: "lang" },

  // Frontend
  { term: "react", aliases: ["reactjs", "react.js"], category: "frontend" },
  { term: "next.js", aliases: ["nextjs", "next js"], category: "frontend" },
  { term: "vue", aliases: ["vuejs", "vue.js"], category: "frontend" },
  { term: "nuxt", aliases: ["nuxtjs"], category: "frontend" },
  { term: "angular", category: "frontend" },
  { term: "svelte", aliases: ["sveltekit"], category: "frontend" },
  { term: "redux", category: "frontend" },
  { term: "tailwind", aliases: ["tailwind css", "tailwindcss"], category: "frontend" },
  { term: "sass", aliases: ["scss"], category: "frontend" },
  { term: "webpack", category: "frontend" },
  { term: "vite", category: "frontend" },
  { term: "storybook", category: "frontend" },
  { term: "graphql", category: "frontend" },

  // Backend
  { term: "node.js", aliases: ["nodejs", "node"], category: "backend" },
  { term: "express", aliases: ["expressjs", "express.js"], category: "backend" },
  { term: "nestjs", aliases: ["nest.js"], category: "backend" },
  { term: "django", category: "backend" },
  { term: "flask", category: "backend" },
  { term: "fastapi", category: "backend" },
  { term: "rails", aliases: ["ruby on rails"], category: "backend" },
  { term: "laravel", category: "backend" },
  // REST: order + plural + phrasing variants all fold to one term so a JD asking
  // for "APIs REST" matches a CV that says "REST APIs" / "RESTful" / "API REST".
  { term: "rest", aliases: ["rest api", "rest apis", "restful", "restful api", "restful apis", "api rest", "apis rest"], category: "backend" },
  { term: "microservices", aliases: ["microservicios"], category: "backend" },
  { term: "grpc", category: "backend" },
  { term: "websockets", category: "backend" },

  // Mobile / iOS
  { term: "react native", category: "mobile" },
  { term: "flutter", category: "mobile" },
  { term: "ios", category: "mobile" },
  { term: "android", category: "mobile" },
  { term: "swiftui", category: "mobile" },
  { term: "jetpack compose", category: "mobile" },
  { term: "xamarin", category: "mobile" },
  { term: "objective-c", aliases: ["objective c", "objectivec"], category: "mobile" },
  { term: "uikit", category: "mobile" },
  { term: "xctest", aliases: ["xc test", "xctests"], category: "mobile" },
  { term: "core data", aliases: ["coredata"], category: "mobile" },
  { term: "cocoa touch", category: "mobile" },
  { term: "cocoapods", aliases: ["cocoa pods"], category: "mobile" },
  { term: "combine", category: "mobile" },
  { term: "mvvm", category: "mobile" },
  { term: "viper", category: "mobile" },
  { term: "async/await", aliases: ["async await", "async-await", "asincronía", "asincronia"], category: "mobile" },
  { term: "clean architecture", aliases: ["arquitectura limpia"], category: "backend" },

  // Data / ML
  { term: "machine learning", aliases: ["ml", "aprendizaje automático"], category: "data" },
  { term: "deep learning", aliases: ["aprendizaje profundo"], category: "data" },
  { term: "tensorflow", category: "data" },
  { term: "pytorch", category: "data" },
  { term: "scikit-learn", aliases: ["sklearn"], category: "data" },
  { term: "pandas", category: "data" },
  { term: "numpy", category: "data" },
  { term: "spark", aliases: ["apache spark"], category: "data" },
  { term: "hadoop", category: "data" },
  { term: "kafka", aliases: ["apache kafka"], category: "data" },
  { term: "airflow", category: "data" },
  { term: "etl", category: "data" },
  { term: "data warehouse", aliases: ["data warehousing"], category: "data" },
  { term: "data modeling", aliases: ["modelado de datos"], category: "data" },
  { term: "nlp", aliases: ["natural language processing", "pln"], category: "data" },
  { term: "computer vision", aliases: ["visión por computadora"], category: "data" },
  { term: "statistics", aliases: ["estadística"], category: "data" },
  { term: "a/b testing", aliases: ["ab testing", "pruebas a/b"], category: "data" },

  // Cloud
  { term: "aws", aliases: ["amazon web services"], category: "cloud" },
  { term: "azure", aliases: ["microsoft azure"], category: "cloud" },
  { term: "gcp", aliases: ["google cloud", "google cloud platform"], category: "cloud" },
  { term: "lambda", category: "cloud" },
  { term: "s3", category: "cloud" },
  { term: "ec2", category: "cloud" },
  { term: "cloudflare", category: "cloud" },
  { term: "vercel", category: "cloud" },
  { term: "heroku", category: "cloud" },
  { term: "digitalocean", category: "cloud" },
  { term: "firebase", category: "cloud" },
  { term: "supabase", category: "cloud" },

  // DevOps
  { term: "docker", category: "devops" },
  { term: "kubernetes", aliases: ["k8s"], category: "devops" },
  { term: "terraform", category: "devops" },
  { term: "ansible", category: "devops" },
  { term: "jenkins", category: "devops" },
  { term: "ci/cd", aliases: ["cicd", "continuous integration"], category: "devops" },
  { term: "github actions", category: "devops" },
  { term: "gitlab", category: "devops" },
  { term: "linux", category: "devops" },
  { term: "nginx", category: "devops" },
  { term: "prometheus", category: "devops" },
  { term: "grafana", category: "devops" },
  { term: "datadog", category: "devops" },
  { term: "sentry", category: "devops" },

  // Databases
  { term: "postgresql", aliases: ["postgres"], category: "db" },
  { term: "mysql", category: "db" },
  { term: "mongodb", aliases: ["mongo"], category: "db" },
  { term: "redis", category: "db" },
  { term: "elasticsearch", category: "db" },
  { term: "dynamodb", category: "db" },
  { term: "sqlite", category: "db" },
  { term: "oracle", aliases: ["oracle db"], category: "db" },
  { term: "sql server", aliases: ["mssql"], category: "db" },
  { term: "snowflake", category: "db" },
  { term: "bigquery", category: "db" },
  { term: "prisma", category: "db" },

  // Design
  { term: "figma", category: "design" },
  { term: "sketch", category: "design" },
  { term: "adobe xd", category: "design" },
  { term: "photoshop", aliases: ["adobe photoshop"], category: "design" },
  { term: "illustrator", aliases: ["adobe illustrator"], category: "design" },
  { term: "premiere", aliases: ["premiere pro", "adobe premiere"], category: "design" },
  { term: "ui design", aliases: ["diseño ui"], category: "design" },
  { term: "ux design", aliases: ["diseño ux"], category: "design" },
  { term: "wireframing", aliases: ["wireframes"], category: "design" },
  { term: "prototyping", aliases: ["prototipado"], category: "design" },
  { term: "user research", aliases: ["investigación de usuario"], category: "design" },
  { term: "design systems", aliases: ["sistema de diseño"], category: "design" },

  // Marketing
  { term: "seo", aliases: ["search engine optimization"], category: "marketing" },
  { term: "sem", category: "marketing" },
  { term: "google ads", aliases: ["adwords"], category: "marketing" },
  { term: "meta ads", aliases: ["facebook ads"], category: "marketing" },
  { term: "linkedin ads", category: "marketing" },
  { term: "tiktok ads", category: "marketing" },
  { term: "google analytics", aliases: ["ga4"], category: "marketing" },
  { term: "mixpanel", category: "marketing" },
  { term: "amplitude", category: "marketing" },
  { term: "hubspot", category: "marketing" },
  { term: "mailchimp", category: "marketing" },
  { term: "klaviyo", category: "marketing" },
  { term: "marketing automation", aliases: ["automatización de marketing"], category: "marketing" },
  { term: "content marketing", aliases: ["marketing de contenidos"], category: "marketing" },
  { term: "email marketing", category: "marketing" },
  { term: "social media", aliases: ["redes sociales"], category: "marketing" },
  { term: "copywriting", category: "marketing" },
  { term: "brand strategy", aliases: ["estrategia de marca"], category: "marketing" },
  { term: "growth hacking", category: "marketing" },
  { term: "conversion rate optimization", aliases: ["cro"], category: "marketing" },

  // Sales
  { term: "salesforce", category: "sales" },
  { term: "pipedrive", category: "sales" },
  { term: "crm", category: "sales" },
  { term: "lead generation", aliases: ["generación de leads"], category: "sales" },
  { term: "cold calling", aliases: ["llamadas en frío"], category: "sales" },
  { term: "account management", aliases: ["gestión de cuentas"], category: "sales" },
  { term: "negotiation", aliases: ["negociación"], category: "sales" },
  { term: "b2b sales", category: "sales" },
  { term: "b2c sales", category: "sales" },
  { term: "saas sales", category: "sales" },

  // PM / methodologies
  { term: "agile", aliases: ["ágil", "metodología ágil"], category: "pm" },
  { term: "scrum", category: "pm" },
  { term: "kanban", category: "pm" },
  { term: "jira", category: "pm" },
  { term: "confluence", category: "pm" },
  { term: "asana", category: "pm" },
  { term: "trello", category: "pm" },
  { term: "notion", category: "pm" },
  // Sin el alias "monday": es un día de la semana. "Coordinó la reunión de los
  // lunes" o "every Monday" etiquetaba a cualquiera con una herramienta de gestión
  // que nunca usó. El nombre del producto lleva el punto-com y con eso alcanza.
  { term: "monday.com", category: "pm" },
  { term: "linear", category: "pm" },
  { term: "product management", aliases: ["gestión de producto", "gestion de producto", "product manager", "gerente de producto"], category: "pm" },
  { term: "project management", aliases: ["gestión de proyectos"], category: "pm" },
  { term: "stakeholder management", aliases: ["gestión de stakeholders", "gestion de stakeholders", "gestion de interesados"], category: "pm" },
  { term: "roadmap", aliases: ["hoja de ruta"], category: "pm" },
  { term: "okrs", aliases: ["okr"], category: "pm" },
  { term: "kpi", aliases: ["kpis"], category: "pm" },
  { term: "lean", category: "pm" },
  { term: "waterfall", aliases: ["cascada"], category: "pm" },

  // Finance
  { term: "excel", category: "finance" },
  { term: "financial modeling", aliases: ["modelado financiero"], category: "finance" },
  { term: "valuation", aliases: ["valoración"], category: "finance" },
  { term: "accounting", aliases: ["contabilidad"], category: "finance" },
  { term: "quickbooks", category: "finance" },
  { term: "sap", category: "finance" },
  { term: "ifrs", category: "finance" },
  { term: "gaap", category: "finance" },
  { term: "forecasting", aliases: ["pronóstico"], category: "finance" },
  { term: "budgeting", aliases: ["presupuestación", "presupuestos", "elaboración de presupuestos"], category: "finance" },
  { term: "p&l", aliases: ["pyl", "profit and loss"], category: "finance" },

  // Banking and credit. Measured 2026-08-18: the whole dictionary answered a
  // banking CV with one term, "risk management" — a credit analyst, a teller and
  // a branch manager had no vocabulary of their own, in either language. Every
  // entry here enters in an unambiguous form: "cartera", "mora", "caja" and
  // "garantía" are ordinary Spanish words and the dictionary is scanned against
  // CV prose, so they are only ever part of a phrase.
  { term: "credit analysis", aliases: ["análisis de crédito", "analisis de credito", "análisis crediticio", "evaluación crediticia", "evaluacion crediticia"], category: "finance" },
  { term: "credit risk", aliases: ["riesgo crediticio", "riesgo de crédito", "riesgo de credito"], category: "finance" },
  { term: "risk assessment", aliases: ["evaluación de riesgos", "evaluacion de riesgos", "análisis de riesgo", "analisis de riesgo"], category: "finance" },
  { term: "portfolio management", aliases: ["gestión de carteras", "gestion de carteras", "administración de cartera", "administracion de cartera"], category: "finance" },
  { term: "loan origination", aliases: ["originación de créditos", "originacion de creditos", "colocación de créditos", "colocacion de creditos", "otorgamiento de créditos"], category: "finance" },
  { term: "credit scoring", aliases: ["scoring crediticio", "calificación crediticia", "calificacion crediticia"], category: "finance" },
  { term: "delinquency management", aliases: ["gestión de mora", "gestion de mora", "cartera en mora", "recuperación de cartera"], category: "finance" },
  { term: "financial statement analysis", aliases: ["análisis de estados financieros", "analisis de estados financieros"], category: "finance" },
  { term: "anti-money laundering", aliases: ["aml", "prevención de lavado de dinero", "prevencion de lavado de dinero", "antilavado", "lavado de activos"], category: "finance" },
  { term: "know your customer", aliases: ["kyc", "conocimiento del cliente", "debida diligencia del cliente"], category: "finance" },
  { term: "banking regulation", aliases: ["normativa bancaria", "regulación bancaria", "regulacion bancaria", "cumplimiento normativo"], category: "finance" },
  { term: "basel accords", aliases: ["basilea", "acuerdos de basilea"], category: "finance" },
  { term: "teller operations", aliases: ["operaciones de caja", "manejo de caja bancaria"], category: "finance" },
  { term: "account opening", aliases: ["apertura de cuentas"], category: "finance" },
  { term: "financial advisory", aliases: ["asesoría financiera", "asesoria financiera", "asesoramiento financiero"], category: "finance" },
  { term: "loan guarantees", aliases: ["garantías crediticias", "garantias crediticias", "avales y garantías"], category: "finance" },
  { term: "budget control", aliases: ["control presupuestario", "control de presupuesto"], category: "finance" },

  // HR
  { term: "recruiting", aliases: ["reclutamiento"], category: "hr" },
  { term: "talent acquisition", aliases: ["adquisición de talento"], category: "hr" },
  { term: "onboarding", category: "hr" },
  { term: "performance management", aliases: ["gestión del desempeño"], category: "hr" },
  { term: "workday", category: "hr" },
  { term: "bamboohr", category: "hr" },
  { term: "compensation", aliases: ["compensaciones"], category: "hr" },
  { term: "labor law", aliases: ["derecho laboral"], category: "hr" },

  // Soft skills
  { term: "leadership", aliases: ["liderazgo"], category: "soft" },
  { term: "communication", aliases: ["comunicación"], category: "soft" },
  { term: "teamwork", aliases: ["trabajo en equipo"], category: "soft" },
  { term: "problem solving", aliases: ["resolución de problemas"], category: "soft" },
  { term: "critical thinking", aliases: ["pensamiento crítico"], category: "soft" },
  { term: "time management", aliases: ["gestión del tiempo"], category: "soft" },
  { term: "adaptability", aliases: ["adaptabilidad"], category: "soft" },
  { term: "collaboration", aliases: ["colaboración"], category: "soft" },
  { term: "creativity", aliases: ["creatividad"], category: "soft" },
  { term: "analytical thinking", aliases: ["pensamiento analítico"], category: "soft" },
  { term: "mentoring", aliases: ["mentoría"], category: "soft" },
  { term: "public speaking", aliases: ["oratoria"], category: "soft" },
  { term: "decision making", aliases: ["toma de decisiones"], category: "soft" },
  { term: "conflict resolution", aliases: ["resolución de conflictos"], category: "soft" },
  { term: "strategic thinking", aliases: ["pensamiento estratégico"], category: "soft" },

  // Industries
  { term: "fintech", category: "industry" },
  { term: "healthcare", aliases: ["salud"], category: "industry" },
  { term: "education", aliases: ["educación"], category: "industry" },
  { term: "e-commerce", aliases: ["ecommerce", "comercio electrónico"], category: "industry" },
  { term: "retail", category: "industry" },
  { term: "logistics", aliases: ["logística"], category: "industry" },
  { term: "manufacturing", aliases: ["manufactura"], category: "industry" },
  { term: "telecommunications", aliases: ["telecomunicaciones"], category: "industry" },
  { term: "saas", category: "industry" },
  { term: "b2b", category: "industry" },
  { term: "b2c", category: "industry" },

  // Certifications
  { term: "pmp", aliases: ["project management professional"], category: "cert" },
  { term: "scrum master", aliases: ["csm", "psm"], category: "cert" },
  { term: "aws certified", category: "cert" },
  { term: "azure certified", category: "cert" },
  { term: "google certified", category: "cert" },
  { term: "cissp", category: "cert" },
  { term: "cisa", category: "cert" },
  { term: "ceh", category: "cert" },
  { term: "comptia", category: "cert" },
  { term: "itil", category: "cert" },
  { term: "six sigma", aliases: ["seis sigma"], category: "cert" },
  { term: "cfa", category: "cert" },
  { term: "cpa", category: "cert" },
  { term: "phr", category: "cert" },
  { term: "shrm", category: "cert" },

  // Tools (cross-cutting)
  { term: "git", category: "tools" },
  { term: "github", category: "tools" },
  { term: "bitbucket", category: "tools" },
  { term: "slack", category: "tools" },
  { term: "zoom", category: "tools" },
  { term: "microsoft office", aliases: ["ms office"], category: "tools" },
  { term: "powerpoint", category: "tools" },
  { term: "word", aliases: ["microsoft word"], category: "tools" },
  { term: "outlook", category: "tools" },
  { term: "google workspace", aliases: ["g suite"], category: "tools" },

  // ── Expanded 2026 batch (high-demand technical skills the dictionary lacked) ──
  // Languages
  { term: "elixir", category: "lang" },
  { term: "erlang", category: "lang" },
  { term: "haskell", category: "lang" },
  { term: "clojure", category: "lang" },
  { term: "lua", category: "lang" },
  { term: "perl", category: "lang" },
  { term: "groovy", category: "lang" },
  { term: "powershell", category: "lang" },
  { term: "solidity", category: "lang" },
  // Frontend
  { term: "remix", category: "frontend" },
  { term: "astro", category: "frontend" },
  { term: "jquery", category: "frontend" },
  { term: "bootstrap", category: "frontend" },
  { term: "material ui", aliases: ["mui"], category: "frontend" },
  { term: "chakra ui", category: "frontend" },
  { term: "zustand", category: "frontend" },
  { term: "mobx", category: "frontend" },
  { term: "rxjs", category: "frontend" },
  { term: "three.js", aliases: ["threejs"], category: "frontend" },
  { term: "d3.js", aliases: ["d3"], category: "frontend" },
  // Backend
  { term: ".net", aliases: ["dotnet"], category: "backend" },
  { term: "asp.net", category: "backend" },
  { term: "spring boot", aliases: ["spring"], category: "backend" },
  { term: "hibernate", category: "backend" },
  { term: "deno", category: "backend" },
  { term: "socket.io", category: "backend" },
  { term: "celery", category: "backend" },
  { term: "rabbitmq", category: "backend" },
  { term: "oauth", aliases: ["oauth2"], category: "backend" },
  { term: "jwt", category: "backend" },
  { term: "saml", category: "backend" },
  // Mobile
  { term: "rxswift", category: "mobile" },
  { term: "ionic", category: "mobile" },
  { term: "capacitor", category: "mobile" },
  { term: "retrofit", category: "mobile" },
  { term: "alamofire", category: "mobile" },
  // Data / AI-ML
  { term: "keras", category: "data" },
  { term: "opencv", category: "data" },
  { term: "langchain", category: "data" },
  { term: "hugging face", aliases: ["huggingface"], category: "data" },
  { term: "mlflow", category: "data" },
  { term: "databricks", category: "data" },
  { term: "tableau", category: "data" },
  { term: "power bi", aliases: ["powerbi"], category: "data" },
  { term: "looker", category: "data" },
  { term: "dbt", category: "data" },
  { term: "apache hive", aliases: ["hive"], category: "data" },
  { term: "apache flink", aliases: ["flink"], category: "data" },
  { term: "rag", aliases: ["retrieval augmented generation"], category: "data" },
  { term: "prompt engineering", category: "data" },
  // Databases
  { term: "cassandra", category: "db" },
  { term: "neo4j", category: "db" },
  { term: "mariadb", category: "db" },
  { term: "cosmos db", aliases: ["cosmosdb"], category: "db" },
  { term: "firestore", category: "db" },
  { term: "memcached", category: "db" },
  // Cloud
  { term: "openshift", category: "cloud" },
  { term: "netlify", category: "cloud" },
  { term: "cloudformation", category: "cloud" },
  // DevOps / SRE
  { term: "argocd", aliases: ["argo cd"], category: "devops" },
  { term: "helm", category: "devops" },
  { term: "circleci", aliases: ["circle ci"], category: "devops" },
  { term: "sonarqube", category: "devops" },
  { term: "splunk", category: "devops" },
  { term: "new relic", category: "devops" },
  { term: "opentelemetry", category: "devops" },
  // Testing / QA
  { term: "jest", category: "tools" },
  { term: "vitest", category: "tools" },
  { term: "cypress", category: "tools" },
  { term: "playwright", category: "tools" },
  { term: "selenium", category: "tools" },
  { term: "jasmine", category: "tools" },
  { term: "mocha", category: "tools" },
  { term: "pytest", category: "tools" },
  { term: "junit", category: "tools" },
  // Dev tools
  { term: "postman", category: "tools" },
  { term: "swagger", aliases: ["openapi"], category: "tools" },
  { term: "jupyter", aliases: ["jupyter notebook"], category: "tools" },
  { term: "vs code", aliases: ["visual studio code", "vscode"], category: "tools" },
  { term: "intellij", aliases: ["intellij idea"], category: "tools" },
  // Design
  { term: "framer", category: "design" },
  { term: "canva", category: "design" },
  { term: "zeplin", category: "design" },
  { term: "invision", category: "design" },
  { term: "webflow", category: "design" },
  // Marketing
  { term: "semrush", category: "marketing" },
  { term: "ahrefs", category: "marketing" },
  { term: "marketo", category: "marketing" },
  { term: "segment", category: "marketing" },
  { term: "google tag manager", aliases: ["gtm"], category: "marketing" },

  // ── iOS / Android / backend tooling batch (native-dev keywords) ──
  // iOS
  { term: "swift package manager", aliases: ["swiftpm", "spm"], category: "mobile" },
  { term: "xcode", category: "mobile" },
  { term: "interface builder", category: "mobile" },
  { term: "fastlane", category: "mobile" },
  { term: "core ml", aliases: ["coreml"], category: "mobile" },
  { term: "arkit", category: "mobile" },
  { term: "avfoundation", category: "mobile" },
  { term: "widgetkit", category: "mobile" },
  { term: "storekit", category: "mobile" },
  { term: "mapkit", category: "mobile" },
  { term: "cloudkit", category: "mobile" },
  { term: "snapkit", category: "mobile" },
  { term: "kingfisher", category: "mobile" },
  { term: "swiftlint", category: "mobile" },
  { term: "testflight", category: "mobile" },
  { term: "instruments", category: "mobile" },
  { term: "realm", category: "mobile" },
  // Android
  { term: "android sdk", category: "mobile" },
  { term: "android studio", category: "mobile" },
  { term: "hilt", category: "mobile" },
  { term: "dagger", category: "mobile" },
  { term: "coroutines", aliases: ["kotlin coroutines"], category: "mobile" },
  { term: "livedata", category: "mobile" },
  { term: "viewmodel", category: "mobile" },
  { term: "workmanager", category: "mobile" },
  { term: "espresso", category: "mobile" },
  { term: "exoplayer", category: "mobile" },
  { term: "firebase crashlytics", aliases: ["crashlytics"], category: "mobile" },
  { term: "mvi", category: "mobile" },
  // Backend frameworks
  { term: "fastify", category: "backend" },
  { term: "koa", category: "backend" },
  { term: "ktor", category: "backend" },
  { term: "quarkus", category: "backend" },
  { term: "micronaut", category: "backend" },
  { term: "sqlalchemy", category: "backend" },
  { term: "sequelize", category: "backend" },
  { term: "typeorm", category: "backend" },
  { term: "gunicorn", category: "backend" },
  { term: "uvicorn", category: "backend" },
  { term: "kong", category: "backend" },
  { term: "protobuf", aliases: ["protocol buffers"], category: "backend" },
  // Build tools
  { term: "gradle", category: "tools" },
  { term: "maven", category: "tools" },
  { term: "npm", category: "tools" },
  { term: "yarn", category: "tools" },
  { term: "pnpm", category: "tools" },
  { term: "bazel", category: "tools" },
  { term: "cmake", category: "tools" },
  // Data engineering / orchestration
  { term: "dagster", category: "data" },
  { term: "prefect", category: "data" },
  { term: "apache superset", aliases: ["superset"], category: "data" },
  { term: "apache pulsar", aliases: ["pulsar"], category: "data" },

  // ── Non-tech professions (profile-aware coverage) ──
  // Design (graphic / product / motion)
  { term: "procreate", category: "design" },
  { term: "blender", category: "design" },
  { term: "cinema 4d", aliases: ["c4d"], category: "design" },
  { term: "coreldraw", category: "design" },
  { term: "affinity designer", category: "design" },
  { term: "affinity photo", category: "design" },
  { term: "motion graphics", aliases: ["motion design", "graficos en movimiento"], category: "design" },
  { term: "typography", category: "design" },
  { term: "color theory", aliases: ["teoria del color"], category: "design" },
  { term: "layout design", category: "design" },
  { term: "print design", category: "design" },
  { term: "packaging design", aliases: ["diseno de packaging", "diseno de empaques"], category: "design" },
  { term: "3d modeling", category: "design" },
  { term: "animation", category: "design" },
  { term: "storyboarding", aliases: ["storyboard", "guion grafico", "storyboards"], category: "design" },
  { term: "logo design", category: "design" },
  { term: "art direction", category: "design" },
  { term: "visual design", category: "design" },
  { term: "illustration", category: "design" },
  // Healthcare — nursing / clinical
  { term: "patient care", aliases: ["atención al paciente", "cuidado del paciente"], category: "healthcare" },
  // Disciplines that are ALSO the profession's headline skill. Missing here, they
  // were being reported as "your degree is listed as a skill" for the very people
  // whose skills list is correct — and, worse, a nurse's resume matched nothing
  // when a posting asked for "nursing". Unambiguous multi-word or profession terms
  // only: nothing that doubles as ordinary prose.
  { term: "nursing", aliases: ["enfermeria", "enfermería"], category: "healthcare" },
  { term: "graphic design", aliases: ["diseño grafico", "diseño gráfico"], category: "design" },
  { term: "industrial design", aliases: ["diseño industrial"], category: "design" },
  { term: "civil engineering", aliases: ["ingenieria civil", "ingeniería civil"], category: "industry" },
  { term: "industrial engineering", aliases: ["ingenieria industrial", "ingeniería industrial"], category: "industry" },
  { term: "architecture", aliases: ["arquitectura"], category: "industry" },
  { term: "psychology", aliases: ["psicologia", "psicología"], category: "healthcare" },
  { term: "veterinary medicine", aliases: ["medicina veterinaria", "veterinaria"], category: "healthcare" },
  { term: "social work", aliases: ["trabajo social"], category: "education" },
  { term: "journalism", aliases: ["periodismo"], category: "marketing" },
  { term: "ehr", aliases: ["electronic health records"], category: "healthcare" },
  { term: "emr", aliases: ["electronic medical records"], category: "healthcare" },
  { term: "epic systems", category: "healthcare" },
  { term: "cerner", category: "healthcare" },
  { term: "meditech", category: "healthcare" },
  { term: "cpr", category: "healthcare" },
  { term: "bls", aliases: ["basic life support"], category: "healthcare" },
  { term: "acls", aliases: ["advanced cardiac life support"], category: "healthcare" },
  { term: "pals", category: "healthcare" },
  { term: "phlebotomy", aliases: ["flebotomía", "extracción de sangre"], category: "healthcare" },
  { term: "triage", aliases: ["triaje", "clasificación de pacientes"], category: "healthcare" },
  { term: "vital signs", aliases: ["signos vitales"], category: "healthcare" },
  { term: "iv therapy", aliases: ["terapia intravenosa"], category: "healthcare" },
  { term: "wound care", aliases: ["cuidado de heridas", "curaciones"], category: "healthcare" },
  { term: "medication administration", aliases: ["administración de medicamentos"], category: "healthcare" },
  { term: "hipaa", category: "healthcare" },
  { term: "patient assessment", aliases: ["valoración del paciente"], category: "healthcare" },
  { term: "care planning", aliases: ["planificación de cuidados"], category: "healthcare" },
  { term: "infection control", aliases: ["control de infecciones", "bioseguridad"], category: "healthcare" },
  { term: "first aid", aliases: ["primeros auxilios"], category: "healthcare" },
  { term: "ekg", aliases: ["ecg"], category: "healthcare" },
  { term: "acute care", aliases: ["cuidados agudos"], category: "healthcare" },
  { term: "telemetry", category: "healthcare" },
  { term: "clinical diagnosis", category: "healthcare" },
  { term: "telemedicine", category: "healthcare" },
  { term: "icd-10", category: "healthcare" },
  { term: "cpt coding", category: "healthcare" },
  { term: "medical coding", aliases: ["codificación médica"], category: "healthcare" },
  { term: "pharmacology", aliases: ["farmacología"], category: "healthcare" },
  { term: "case management", aliases: ["gestión de casos"], category: "healthcare" },
  // Education
  { term: "lesson planning", aliases: ["planificación de clases", "planificación de lecciones"], category: "education" },
  { term: "curriculum development", aliases: ["desarrollo curricular"], category: "education" },
  { term: "classroom management", aliases: ["gestión del aula", "manejo del aula"], category: "education" },
  { term: "differentiated instruction", aliases: ["instrucción diferenciada"], category: "education" },
  { term: "google classroom", category: "education" },
  { term: "canvas lms", aliases: ["canvas"], category: "education" },
  { term: "blackboard", category: "education" },
  { term: "student assessment", aliases: ["evaluación de estudiantes"], category: "education" },
  { term: "iep", aliases: ["individualized education program"], category: "education" },
  { term: "special education", aliases: ["educación especial"], category: "education" },
  { term: "instructional design", aliases: ["diseño instruccional"], category: "education" },
  { term: "e-learning", category: "education" },
  { term: "tutoring", aliases: ["tutoría", "clases particulares"], category: "education" },
  // Legal
  { term: "legal research", aliases: ["investigación jurídica"], category: "legal" },
  { term: "contract drafting", aliases: ["redacción de contratos"], category: "legal" },
  { term: "litigation", aliases: ["litigio", "litigación"], category: "legal" },
  { term: "due diligence", aliases: ["debida diligencia"], category: "legal" },
  { term: "westlaw", category: "legal" },
  { term: "lexisnexis", category: "legal" },
  { term: "legal writing", aliases: ["redacción jurídica"], category: "legal" },
  { term: "regulatory compliance", aliases: ["compliance", "cumplimiento normativo"], category: "legal" },
  { term: "intellectual property", aliases: ["propiedad intelectual"], category: "legal" },
  { term: "corporate law", aliases: ["derecho corporativo"], category: "legal" },
  { term: "contract negotiation", aliases: ["negociación de contratos"], category: "legal" },
  { term: "e-discovery", category: "legal" },
  // Operations / trades / hospitality
  { term: "supply chain management", aliases: ["gestión de la cadena de suministro"], category: "operations" },
  { term: "inventory management", aliases: ["gestión de inventario", "control de existencias"], category: "operations" },
  { term: "procurement", aliases: ["abastecimiento", "gestion de compras", "gestión de compras"], category: "operations" },
  { term: "quality control", aliases: ["control de calidad"], category: "operations" },
  { term: "lean manufacturing", aliases: ["manufactura esbelta"], category: "operations" },
  { term: "warehouse management", aliases: ["gestión de almacén", "almacén"], category: "operations" },
  { term: "forklift operation", aliases: ["operación de montacargas", "montacargas"], category: "operations" },
  { term: "welding", aliases: ["soldadura"], category: "operations" },
  { term: "cnc machining", aliases: ["cnc"], category: "operations" },
  { term: "blueprint reading", aliases: ["lectura de planos"], category: "operations" },
  { term: "hvac", category: "operations" },
  { term: "osha", category: "operations" },
  { term: "food safety", aliases: ["inocuidad alimentaria", "manipulación de alimentos"], category: "operations" },
  { term: "servsafe", category: "operations" },
  { term: "pos systems", aliases: ["point of sale"], category: "operations" },
  { term: "customer service", aliases: ["servicio al cliente", "atención al cliente"], category: "operations" },
  { term: "culinary arts", aliases: ["artes culinarias", "gastronomía"], category: "operations" },
  { term: "fleet management", aliases: ["gestión de flotas"], category: "operations" },

  // ── 2026-08 coverage batch: measured gaps, not guesses ──────────────────
  // Audited by listing what a real iOS/Android/web/cloud/security/QA CV names
  // and checking each against isKnownSkill(): 44 of 79 iOS terms and 32 of 51
  // Android terms were missing, so the autocomplete had nothing to offer a
  // mobile candidate past the basics.
  //
  // RULE OBSERVED (a lesson already paid for): a term that is ALSO an ordinary
  // word never enters as itself — every entry here is scanned against the CV's
  // own prose by proven-skills, so "room", "glide", "expo", "metal", "vault",
  // "less", "recoil", "rollup" and "unity" would produce false "you already
  // proved this". They enter only in an unambiguous form ("room database",
  // "metal api", "hashicorp vault", "unity engine") or not at all.

  // iOS — frameworks, concurrency, distribution
  { term: "core animation", category: "mobile" },
  { term: "core graphics", category: "mobile" },
  { term: "core location", category: "mobile" },
  { term: "core bluetooth", category: "mobile" },
  { term: "core motion", aliases: ["coremotion"], category: "mobile" },
  { term: "core spotlight", category: "mobile" },
  { term: "metal api", category: "mobile" },
  { term: "grand central dispatch", aliases: ["gcd", "dispatch queues"], category: "mobile" },
  { term: "urlsession", aliases: ["nsurlsession"], category: "mobile" },
  { term: "keychain services", aliases: ["keychain"], category: "mobile" },
  { term: "push notifications", aliases: ["apns", "notificaciones push"], category: "mobile" },
  { term: "healthkit", category: "mobile" },
  { term: "homekit", category: "mobile" },
  { term: "sirikit", category: "mobile" },
  { term: "watchkit", category: "mobile" },
  { term: "swiftdata", category: "mobile" },
  { term: "swift concurrency", aliases: ["structured concurrency"], category: "mobile" },
  { term: "protocol oriented programming", aliases: ["protocol-oriented programming"], category: "mobile" },
  { term: "codable", category: "mobile" },
  { term: "auto layout", aliases: ["autolayout"], category: "mobile" },
  { term: "xcuitest", category: "mobile" },
  { term: "xcframework", category: "mobile" },
  { term: "app store connect", category: "mobile" },
  { term: "app clips", category: "mobile" },
  { term: "in-app purchases", aliases: ["in app purchases", "compras dentro de la app"], category: "mobile" },
  { term: "universal links", category: "mobile" },
  { term: "deep linking", aliases: ["deeplinking", "enlaces profundos"], category: "mobile" },
  { term: "carthage", category: "mobile" },
  { term: "tvos", category: "mobile" },
  { term: "ipados", category: "mobile" },
  { term: "visionos", category: "mobile" },
  { term: "memory management", aliases: ["gestion de memoria", "gestión de memoria", "automatic reference counting"], category: "mobile" },
  { term: "crash reporting", aliases: ["reporte de errores"], category: "mobile" },
  { term: "firebase analytics", category: "mobile" },

  // Android — Jetpack, DI, networking, release
  { term: "room database", aliases: ["androidx room"], category: "mobile" },
  { term: "okhttp", category: "mobile" },
  { term: "koin", category: "mobile" },
  { term: "kotlin flow", aliases: ["kotlin flows", "stateflow"], category: "mobile" },
  { term: "android jetpack", aliases: ["jetpack"], category: "mobile" },
  { term: "navigation component", aliases: ["jetpack navigation"], category: "mobile" },
  { term: "data binding", category: "mobile" },
  { term: "view binding", category: "mobile" },
  { term: "material design", aliases: ["material 3", "material you"], category: "mobile" },
  { term: "rxjava", category: "mobile" },
  { term: "mockito", category: "mobile" },
  { term: "robolectric", category: "mobile" },
  { term: "leakcanary", category: "mobile" },
  { term: "gson", category: "mobile" },
  { term: "moshi", category: "mobile" },
  { term: "proguard", aliases: ["r8"], category: "mobile" },
  { term: "android ndk", aliases: ["ndk"], category: "mobile" },
  { term: "google play console", aliases: ["play console"], category: "mobile" },
  { term: "broadcast receivers", aliases: ["content providers"], category: "mobile" },
  { term: "foreground services", aliases: ["servicios en primer plano"], category: "mobile" },
  { term: "kotlin multiplatform", aliases: ["kmp"], category: "mobile" },
  { term: "compose multiplatform", category: "mobile" },
  // "MVP" stays OUT as a searchable form on purpose: in a business CV it is the
  // minimum viable product, and it was flagged as a proven mobile skill for an
  // accountant. The architecture pattern enters under its full name only.
  { term: "model view presenter", category: "mobile" },
  { term: "mvc", aliases: ["model view controller"], category: "mobile" },

  // Cross-platform
  { term: "cordova", aliases: ["apache cordova"], category: "mobile" },
  { term: ".net maui", aliases: ["net maui", "dotnet maui"], category: "mobile" },
  { term: "unity engine", aliases: ["unity 3d", "unity3d"], category: "mobile" },
  { term: "unreal engine", category: "mobile" },
  { term: "electron", category: "frontend" },
  { term: "tauri", category: "frontend" },

  // Frontend / web platform
  { term: "solidjs", aliases: ["solid.js"], category: "frontend" },
  { term: "styled-components", aliases: ["styled components"], category: "frontend" },
  { term: "esbuild", category: "frontend" },
  { term: "rollup.js", aliases: ["rollupjs"], category: "frontend" },
  { term: "babel", category: "frontend" },
  { term: "react query", aliases: ["tanstack query"], category: "frontend" },
  { term: "apollo graphql", aliases: ["apollo client"], category: "frontend" },
  { term: "trpc", category: "frontend" },
  { term: "testing library", aliases: ["react testing library"], category: "frontend" },
  { term: "web components", category: "frontend" },
  { term: "progressive web apps", aliases: ["pwa", "pwas"], category: "frontend" },
  { term: "service workers", category: "frontend" },
  { term: "webassembly", aliases: ["wasm"], category: "frontend" },
  { term: "framer motion", category: "frontend" },
  { term: "web accessibility", aliases: ["a11y", "accesibilidad web"], category: "frontend" },
  { term: "wcag", category: "frontend" },
  { term: "responsive design", aliases: ["diseno responsivo", "diseño responsivo", "responsive web design"], category: "frontend" },

  // Backend
  { term: "symfony", category: "backend" },
  { term: "asp.net core", aliases: ["aspnet core"], category: "backend" },
  { term: "phoenix framework", category: "backend" },
  { term: "entity framework", aliases: ["ef core"], category: "backend" },
  { term: "message queues", aliases: ["colas de mensajes"], category: "backend" },

  // Data / AI
  { term: "clickhouse", category: "db" },
  { term: "amazon redshift", aliases: ["redshift"], category: "db" },
  { term: "large language models", aliases: ["llm", "llms", "modelos de lenguaje"], category: "data" },
  { term: "kubeflow", category: "data" },

  // Cloud / DevOps / SRE
  { term: "pulumi", category: "devops" },
  { term: "gitlab ci", aliases: ["gitlab ci/cd"], category: "devops" },
  { term: "serverless architecture", aliases: ["serverless"], category: "cloud" },
  { term: "amazon rds", aliases: ["rds"], category: "cloud" },
  { term: "hashicorp vault", category: "devops" },
  { term: "load balancing", aliases: ["balanceo de carga"], category: "devops" },
  { term: "site reliability engineering", aliases: ["sre"], category: "devops" },
  { term: "observability", aliases: ["observabilidad"], category: "devops" },

  // Security
  { term: "penetration testing", aliases: ["pentesting", "pruebas de penetracion", "pruebas de penetración"], category: "industry" },
  { term: "owasp", aliases: ["owasp top 10"], category: "industry" },
  { term: "burp suite", category: "tools" },
  { term: "threat modeling", aliases: ["modelado de amenazas"], category: "industry" },
  { term: "siem", category: "industry" },
  { term: "security operations center", aliases: ["soc analyst", "centro de operaciones de seguridad"], category: "industry" },
  { term: "iso 27001", category: "cert" },
  { term: "gdpr", aliases: ["rgpd"], category: "legal" },
  { term: "encryption", aliases: ["cifrado", "encriptacion", "encriptación"], category: "industry" },
  { term: "ssl/tls", aliases: ["tls"], category: "industry" },
  { term: "zero trust", category: "industry" },
  { term: "identity and access management", aliases: ["iam", "gestion de identidades", "gestión de identidades"], category: "industry" },
  { term: "multi-factor authentication", aliases: ["mfa", "autenticacion multifactor", "autenticación multifactor"], category: "industry" },
  { term: "vulnerability assessment", aliases: ["analisis de vulnerabilidades", "análisis de vulnerabilidades"], category: "industry" },

  // QA / testing
  { term: "manual testing", aliases: ["pruebas manuales", "testing manual", "qa manual"], category: "tools" },
  { term: "test automation", aliases: ["automation testing", "automatizacion de pruebas", "automatización de pruebas"], category: "tools" },
  { term: "appium", category: "tools" },
  { term: "k6", category: "tools" },
  { term: "jmeter", aliases: ["apache jmeter"], category: "tools" },
  { term: "regression testing", aliases: ["pruebas de regresion", "pruebas de regresión"], category: "tools" },
  { term: "tdd", aliases: ["test driven development", "desarrollo guiado por pruebas"], category: "tools" },
  { term: "bdd", aliases: ["behavior driven development"], category: "tools" },
  { term: "cucumber", category: "tools" },
  { term: "testrail", category: "tools" },

  // Game dev
  { term: "shader programming", aliases: ["shaders"], category: "tools" },
  { term: "game design", aliases: ["diseno de juegos", "diseño de juegos"], category: "design" },
  { term: "level design", category: "design" },

  // ── Non-tech coverage batch: same audit, other fields ───────────────────
  // The dictionary is not a tech dictionary. Measured the same way against what
  // a nurse, a teacher, an accountant, a cook and a tradesperson actually list:
  // 86 of 183 common terms were missing, so those CVs got an autocomplete that
  // knew Kubernetes and not "wound care". Bilingual, because the CV and the job
  // ad are often not written in the same language.

  // Healthcare
  { term: "patient education", aliases: ["educacion al paciente", "educación al paciente"], category: "healthcare" },
  { term: "medical terminology", aliases: ["terminologia medica", "terminología médica"], category: "healthcare" },
  { term: "catheter care", aliases: ["cuidado de cateter", "cuidado de catéter"], category: "healthcare" },
  { term: "care plans", aliases: ["planes de cuidado"], category: "healthcare" },
  { term: "discharge planning", aliases: ["planificacion del alta", "planificación del alta"], category: "healthcare" },
  { term: "geriatric care", aliases: ["cuidado geriatrico", "cuidado geriátrico", "geriatria", "geriatría"], category: "healthcare" },
  { term: "pediatric care", aliases: ["cuidado pediatrico", "cuidado pediátrico", "pediatria", "pediatría"], category: "healthcare" },
  { term: "mental health", aliases: ["salud mental"], category: "healthcare" },
  { term: "physical therapy", aliases: ["fisioterapia", "terapia fisica", "terapia física"], category: "healthcare" },
  { term: "radiology", aliases: ["radiologia", "radiología"], category: "healthcare" },
  { term: "ultrasound", aliases: ["ecografia", "ecografía"], category: "healthcare" },
  { term: "sterilization", aliases: ["esterilizacion", "esterilización"], category: "healthcare" },
  { term: "medical billing", aliases: ["facturacion medica", "facturación médica"], category: "healthcare" },
  { term: "prior authorization", aliases: ["autorizacion previa", "autorización previa"], category: "healthcare" },
  { term: "intensive care", aliases: ["icu", "uci", "cuidados intensivos"], category: "healthcare" },
  { term: "emergency care", aliases: ["emergency room", "urgencias", "atencion de urgencias", "atención de urgencias"], category: "healthcare" },

  // Education
  { term: "curriculum design", aliases: ["diseno curricular", "diseño curricular"], category: "education" },
  { term: "early childhood education", aliases: ["educacion inicial", "educación inicial"], category: "education" },
  { term: "esl", aliases: ["english as a second language", "ingles como segunda lengua", "inglés como segunda lengua"], category: "education" },
  { term: "bilingual education", aliases: ["educacion bilingue", "educación bilingüe"], category: "education" },
  { term: "parent communication", aliases: ["comunicacion con padres", "comunicación con padres"], category: "education" },
  { term: "behavior management", aliases: ["manejo de conducta"], category: "education" },
  { term: "formative assessment", aliases: ["evaluacion formativa", "evaluación formativa"], category: "education" },
  { term: "stem education", aliases: ["educacion stem", "educación stem"], category: "education" },
  { term: "montessori", category: "education" },

  // Legal
  { term: "depositions", aliases: ["declaraciones juradas"], category: "legal" },
  { term: "notary", aliases: ["notaria", "notaría", "notarial"], category: "legal" },
  { term: "paralegal", aliases: ["asistente legal"], category: "legal" },
  { term: "data privacy", aliases: ["privacidad de datos", "proteccion de datos", "protección de datos"], category: "legal" },

  // Finance / accounting
  { term: "accounts payable", aliases: ["cuentas por pagar"], category: "finance" },
  { term: "accounts receivable", aliases: ["cuentas por cobrar"], category: "finance" },
  { term: "reconciliation", aliases: ["conciliacion bancaria", "conciliación bancaria"], category: "finance" },
  { term: "payroll", aliases: ["nomina", "nómina", "planilla de sueldos"], category: "finance" },
  { term: "tax preparation", aliases: ["preparacion de impuestos", "preparación de impuestos", "declaracion de impuestos"], category: "finance" },
  { term: "auditing", aliases: ["auditoria", "auditoría"], category: "finance" },
  { term: "variance analysis", aliases: ["analisis de desviaciones", "análisis de desviaciones"], category: "finance" },
  { term: "cost accounting", aliases: ["contabilidad de costos"], category: "finance" },
  { term: "treasury", aliases: ["tesoreria", "tesorería"], category: "finance" },
  { term: "financial reporting", aliases: ["reportes financieros", "estados financieros"], category: "finance" },
  { term: "cash flow management", aliases: ["gestion de flujo de caja", "gestión de flujo de caja", "flujo de caja"], category: "finance" },

  // Sales / marketing
  { term: "upselling", aliases: ["venta adicional", "venta cruzada", "cross-selling"], category: "sales" },
  { term: "pipeline management", aliases: ["gestion de pipeline", "gestión de pipeline"], category: "sales" },
  { term: "market research", aliases: ["investigacion de mercado", "investigación de mercado"], category: "marketing" },
  { term: "influencer marketing", aliases: ["marketing de influencers"], category: "marketing" },

  // Trades / operations / logistics
  { term: "plumbing", aliases: ["plomeria", "plomería", "gasfiteria", "fontaneria"], category: "operations" },
  { term: "preventive maintenance", aliases: ["mantenimiento preventivo"], category: "operations" },
  { term: "supply chain", aliases: ["cadena de suministro"], category: "operations" },
  { term: "route planning", aliases: ["planificacion de rutas", "planificación de rutas"], category: "operations" },
  { term: "heavy machinery", aliases: ["maquinaria pesada"], category: "operations" },
  { term: "carpentry", aliases: ["carpinteria", "carpintería"], category: "operations" },
  { term: "industrial painting", aliases: ["pintura industrial", "pintura de obra"], category: "operations" },

  // Hospitality
  { term: "menu planning", aliases: ["planificacion de menus", "planificación de menús"], category: "operations" },
  { term: "bartending", aliases: ["bartender", "cocteleria", "coctelería"], category: "operations" },
  { term: "barista", category: "operations" },
  { term: "inventory control", aliases: ["control de inventario"], category: "operations" },
  { term: "catering", aliases: ["banquetes"], category: "operations" },
  { term: "event planning", aliases: ["organizacion de eventos", "organización de eventos"], category: "operations" },
  { term: "housekeeping", aliases: ["ama de llaves"], category: "operations" },
  { term: "opera pms", category: "operations" },

  // HR / admin
  { term: "payroll administration", aliases: ["administracion de nomina", "administración de nómina"], category: "hr" },
  { term: "employee relations", aliases: ["relaciones laborales"], category: "hr" },
  { term: "hris", aliases: ["sistema de informacion de rrhh"], category: "hr" },
  { term: "training and development", aliases: ["capacitacion y desarrollo", "capacitación y desarrollo", "capacitacion", "capacitación"], category: "hr" },
  { term: "succession planning", aliases: ["plan de sucesion", "plan de sucesión"], category: "hr" },
  { term: "compensation and benefits", aliases: ["compensacion y beneficios", "compensación y beneficios"], category: "hr" },
  { term: "data entry", aliases: ["ingreso de datos", "captura de datos"], category: "operations" },
  { term: "scheduling", aliases: ["programacion de turnos", "programación de turnos", "gestion de agenda"], category: "operations" },
  { term: "calendar management", aliases: ["gestion de calendario", "gestión de calendario"], category: "operations" },
  { term: "travel arrangements", aliases: ["gestion de viajes", "gestión de viajes"], category: "operations" },

  // Design
  { term: "ux research", aliases: ["investigacion ux", "investigación ux"], category: "design" },
  { term: "user testing", aliases: ["pruebas de usuario", "usability testing"], category: "design" },
  { term: "accessibility design", aliases: ["diseno accesible", "diseño accesible"], category: "design" },
  // Spanish-first everyday skills that had no entry at all — measured against
  // real es CVs (cash handling, teaching, invoicing, collections, translation).
  { term: "cash handling", aliases: ["manejo de caja", "manejo de efectivo", "arqueo de caja"], category: "operations" },
  { term: "teaching", aliases: ["docencia", "ensenanza", "enseñanza"], category: "education" },
  { term: "invoicing", aliases: ["facturacion", "facturación", "billing"], category: "finance" },
  { term: "collections", aliases: ["cobranzas", "gestion de cobranzas", "gestión de cobranzas"], category: "finance" },
  { term: "translation", aliases: ["traduccion", "traducción", "interpretacion", "interpretación"], category: "industry" },
  { term: "technical writing", aliases: ["redaccion tecnica", "redacción técnica"], category: "industry" },
  { term: "occupational safety", aliases: ["seguridad industrial", "seguridad ocupacional", "seguridad y salud en el trabajo"], category: "operations" },
  { term: "phone support", aliases: ["atencion telefonica", "atención telefónica", "call center"], category: "operations" },

  // ── Agile / Scrum ────────────────────────────────────────────────────────────
  // Measured before writing this: 15 of the 20 terms a Scrum Master's CV and a
  // Scrum job posting both use were missing, so the whole ceremony vocabulary was
  // invisible to the matcher. Spanish aliases throughout: LATAM CVs say "reunión
  // diaria" and "planificación de sprint".
  //
  // NOT ADDED BARE, and each for a reason the dictionary has already paid for:
  //   · "velocity" — an ordinary English noun; enters as "sprint velocity"
  //   · "SAFe"     — "safe" is one of the commonest words there is
  // The dictionary is scanned against CV PROSE, so a bare common word tags people
  // who never claimed the skill.
  { term: "sprint planning", aliases: ["planificacion de sprint", "planning de sprint"], category: "pm" },
  { term: "daily standup", aliases: ["daily scrum", "reunion diaria", "daily meeting", "stand-up"], category: "pm" },
  { term: "sprint retrospective", aliases: ["retrospectiva", "retrospectiva de sprint", "retro"], category: "pm" },
  { term: "sprint review", aliases: ["revision de sprint", "demo de sprint"], category: "pm" },
  { term: "backlog grooming", aliases: ["backlog refinement", "refinamiento del backlog", "refinamiento de backlog"], category: "pm" },
  { term: "product backlog", aliases: ["backlog del producto"], category: "pm" },
  { term: "story points", aliases: ["puntos de historia", "estimacion por puntos"], category: "pm" },
  { term: "sprint velocity", aliases: ["velocidad del equipo", "velocidad de sprint"], category: "pm" },
  { term: "burndown chart", aliases: ["grafico burndown", "burnup chart"], category: "pm" },
  { term: "scaled agile framework", aliases: ["safe framework", "safe agile"], category: "pm" },
  { term: "agile coaching", aliases: ["coaching agil", "agile coach"], category: "pm" },
  { term: "impediment removal", aliases: ["remocion de impedimentos", "gestion de impedimentos"], category: "pm" },
  { term: "definition of done", aliases: ["definicion de terminado", "dod"], category: "pm" },
  { term: "definition of ready", aliases: ["definicion de listo"], category: "pm" },
  { term: "user stories", aliases: ["historias de usuario", "user story"], category: "pm" },
  { term: "acceptance criteria", aliases: ["criterios de aceptacion"], category: "pm" },
  { term: "azure devops", aliases: ["vsts", "tfs"], category: "pm" },
  { term: "ceremonias agiles", aliases: ["agile ceremonies", "scrum ceremonies"], category: "pm" },
  { term: "cross-functional teams", aliases: ["equipos multifuncionales", "equipos interdisciplinarios"], category: "pm" },
  { term: "servant leadership", aliases: ["liderazgo de servicio"], category: "pm" },

  // ── Product management ───────────────────────────────────────────────────────
  // 21 of 30 were missing — the worst-covered discipline in the dictionary.
  //
  // The JOB TITLES enter as ABILITIES ("product management", "product ownership")
  // rather than as "Product Manager". A title is not a skill: the proven-skills
  // card would otherwise offer a Product Owner their own job title as a chip to
  // add, which is the same noise as a degree sitting in the Skills list.
  //
  // NOT ADDED BARE: "RICE" (a staple food in half the world's CVs) and "MoSCoW"
  // (a city). Both enter qualified.
  { term: "product ownership", aliases: ["product owner", "dueno de producto", "propietario de producto"], category: "pm" },
  { term: "product roadmap", aliases: ["roadmap de producto", "hoja de ruta del producto", "roadmapping"], category: "pm" },
  { term: "product discovery", aliases: ["descubrimiento de producto"], category: "pm" },
  { term: "product strategy", aliases: ["estrategia de producto"], category: "pm" },
  { term: "product analytics", aliases: ["analitica de producto", "analitica de uso"], category: "pm" },
  { term: "competitive analysis", aliases: ["analisis de competencia", "analisis competitivo", "benchmarking"], category: "pm" },
  { term: "customer interviews", aliases: ["entrevistas con usuarios", "entrevistas a clientes"], category: "pm" },
  { term: "feature prioritization", aliases: ["priorizacion de funcionalidades", "priorizacion de features"], category: "pm" },
  { term: "rice prioritization", aliases: ["rice scoring", "priorizacion rice"], category: "pm" },
  { term: "moscow prioritization", aliases: ["moscow method", "priorizacion moscow"], category: "pm" },
  { term: "go-to-market", aliases: ["salida al mercado", "lanzamiento al mercado"], category: "pm" },
  { term: "pricing strategy", aliases: ["estrategia de precios", "politica de precios"], category: "pm" },
  { term: "product requirements document", aliases: ["prd", "documento de requisitos"], category: "pm" },
  { term: "mvp definition", aliases: ["definicion del mvp", "producto minimo viable", "minimum viable product"], category: "pm" },
  { term: "user personas", aliases: ["buyer persona", "perfiles de usuario", "arquetipos de usuario"], category: "pm" },
  { term: "customer journey mapping", aliases: ["mapa de experiencia del cliente", "customer journey", "journey map"], category: "pm" },
  { term: "retention analysis", aliases: ["analisis de retencion"], category: "pm" },
  { term: "funnel analysis", aliases: ["analisis de embudo", "embudo de conversion"], category: "pm" },
  { term: "cohort analysis", aliases: ["analisis de cohortes"], category: "pm" },
  { term: "north star metric", aliases: ["metrica estrella"], category: "pm" },

  // ── Backend architecture ─────────────────────────────────────────────────────
  // The named patterns a backend posting asks for by name. Verbs and plain nouns
  // stay out; these are all multi-word and unambiguous in prose.
  { term: "event-driven architecture", aliases: ["arquitectura orientada a eventos", "event driven"], category: "backend" },
  { term: "api gateway", aliases: ["puerta de enlace de api"], category: "backend" },
  { term: "message queue", aliases: ["cola de mensajes", "colas de mensajeria"], category: "backend" },
  { term: "rate limiting", aliases: ["limitacion de tasa", "throttling"], category: "backend" },
  { term: "connection pooling", aliases: ["pool de conexiones"], category: "backend" },
  { term: "database sharding", aliases: ["sharding", "particionado de base de datos"], category: "backend" },
  { term: "caching strategy", aliases: ["estrategia de cache", "cacheo", "caching"], category: "backend" },
  { term: "horizontal scaling", aliases: ["escalado horizontal", "escalamiento horizontal"], category: "backend" },
  { term: "idempotency", aliases: ["idempotencia"], category: "backend" },
  { term: "circuit breaker", aliases: ["patron circuit breaker"], category: "backend" },
  { term: "database migrations", aliases: ["migraciones de base de datos"], category: "backend" },
  { term: "background jobs", aliases: ["trabajos en segundo plano", "tareas programadas", "cron jobs"], category: "backend" },
  { term: "webhooks", aliases: ["webhook"], category: "backend" },
  { term: "server-sent events", aliases: ["sse"], category: "backend" },

  // ── Graphic design ───────────────────────────────────────────────────────────
  // Print and editorial were missing entirely — the dictionary knew product design
  // and not the half of the profession that predates screens.
  { term: "adobe indesign", aliases: ["indesign"], category: "design" },
  { term: "adobe after effects", aliases: ["after effects"], category: "design" },
  { term: "adobe lightroom", aliases: ["lightroom"], category: "design" },
  { term: "editorial design", aliases: ["diseno editorial", "maquetacion"], category: "design" },
  { term: "print production", aliases: ["produccion grafica", "artes finales", "pre-prensa", "preprensa"], category: "design" },
  { term: "vector illustration", aliases: ["ilustracion vectorial"], category: "design" },
  { term: "photo retouching", aliases: ["retoque fotografico", "retoque digital"], category: "design" },
  { term: "brand identity", aliases: ["identidad de marca", "identidad visual", "manual de marca", "branding"], category: "design" },
  { term: "signage design", aliases: ["senaletica", "diseno de senaletica"], category: "design" },

  // ── QA ───────────────────────────────────────────────────────────────────────
  // "QA Manual" was the missing one worth naming: the skill is manual testing, and
  // "manual" on its own is a common word in every language this product supports.
  { term: "smoke testing", aliases: ["pruebas de humo"], category: "tools" },
  { term: "performance testing", aliases: ["pruebas de rendimiento", "pruebas de carga", "load testing"], category: "tools" },
  { term: "test cases", aliases: ["casos de prueba", "test case"], category: "tools" },
  { term: "test plan", aliases: ["plan de pruebas", "test plans"], category: "tools" },
  { term: "bug tracking", aliases: ["seguimiento de errores", "gestion de bugs", "reporte de bugs"], category: "tools" },
  { term: "exploratory testing", aliases: ["pruebas exploratorias"], category: "tools" },

  // ── iOS / Android, the last gaps ─────────────────────────────────────────────
  // "TCA" is NOT an alias: in a biochemistry CV it is the tricarboxylic acid cycle.
  // Same rule that keeps bare "MVP" out.
  { term: "the composable architecture", aliases: ["tca architecture", "composable architecture"], category: "mobile" },
  { term: "voiceover accessibility", aliases: ["accesibilidad voiceover", "accesibilidad ios"], category: "mobile" },
  { term: "jetpack datastore", aliases: ["android datastore"], category: "mobile" },

  // ── Data / AI, the last gaps ─────────────────────────────────────────────────
  { term: "feature engineering", aliases: ["ingenieria de caracteristicas"], category: "data" },
  { term: "vector database", aliases: ["base de datos vectorial", "pgvector", "pinecone"], category: "data" },

  // ── iOS, la capa que faltaba ─────────────────────────────────────────────────
  // Medido: 34 de 40 términos que una oferta iOS senior nombra por su nombre no
  // estaban. EXCLUIDOS por ser palabras corrientes: "Actors" (entra como "swift
  // actors"), "Quick" y "Nimble" (frameworks cuyos nombres son adjetivos ingleses
  // de uso diario), "Handoff" (entra como "apple handoff").
  { term: "core image", aliases: ["coreimage"], category: "mobile" },
  { term: "core audio", aliases: ["coreaudio"], category: "mobile" },
  { term: "core text", category: "mobile" },
  { term: "core nfc", aliases: ["nfc"], category: "mobile" },
  { term: "background tasks", aliases: ["tareas en segundo plano", "background modes"], category: "mobile" },
  { term: "app extensions", aliases: ["extensiones de app", "share extension", "notification service extension"], category: "mobile" },
  { term: "live activities", aliases: ["actividades en vivo", "dynamic island"], category: "mobile" },
  { term: "swiftui navigation", aliases: ["navigationstack", "navigation stack"], category: "mobile" },
  { term: "property wrappers", aliases: ["property wrapper"], category: "mobile" },
  { term: "result builders", aliases: ["function builders"], category: "mobile" },
  { term: "swift actors", aliases: ["actor isolation", "swift actor"], category: "mobile" },
  { term: "memory leaks", aliases: ["fugas de memoria", "retain cycles", "ciclos de retencion"], category: "mobile" },
  { term: "instruments profiling", aliases: ["profiling con instruments", "time profiler"], category: "mobile" },
  { term: "xcode cloud", category: "mobile" },
  { term: "swift testing", category: "mobile" },
  { term: "objective-c runtime", aliases: ["runtime de objective-c", "method swizzling"], category: "mobile" },
  { term: "size classes", aliases: ["clases de tamano"], category: "mobile" },
  { term: "dark mode support", aliases: ["soporte modo oscuro", "modo oscuro"], category: "mobile" },
  { term: "localization", aliases: ["localizacion de apps", "i18n", "internacionalizacion", "internationalization"], category: "mobile" },
  { term: "app thinning", aliases: ["bitcode", "on-demand resources"], category: "mobile" },
  { term: "code signing", aliases: ["firma de codigo", "provisioning profiles", "perfiles de aprovisionamiento"], category: "mobile" },
  { term: "mobile device management", aliases: ["mdm", "gestion de dispositivos moviles"], category: "mobile" },
  { term: "apple handoff", aliases: ["continuity"], category: "mobile" },
  { term: "siri shortcuts", aliases: ["app intents", "atajos de siri"], category: "mobile" },

  // ── Android, la capa que faltaba ─────────────────────────────────────────────
  // EXCLUIDOS: "Timber" (madera) y "Turbine" (turbina) — nombres de librerías que
  // son sustantivos corrientes en CVs de construcción y energía.
  { term: "jetpack paging", aliases: ["paging library", "paging 3"], category: "mobile" },
  { term: "camerax", aliases: ["camera2"], category: "mobile" },
  { term: "media3", aliases: ["exoplayer media3"], category: "mobile" },
  { term: "compose navigation", category: "mobile" },
  { term: "compose testing", category: "mobile" },
  { term: "baseline profiles", aliases: ["perfiles baseline"], category: "mobile" },
  { term: "android app bundles", aliases: ["app bundle", "aab"], category: "mobile" },
  { term: "play feature delivery", aliases: ["dynamic feature modules"], category: "mobile" },
  { term: "in-app updates", aliases: ["actualizaciones en la app"], category: "mobile" },
  { term: "firebase remote config", aliases: ["remote config", "feature flags"], category: "mobile" },
  { term: "android auto", category: "mobile" },
  { term: "wear os", aliases: ["android wear"], category: "mobile" },
  { term: "android tv", category: "mobile" },
  { term: "kotlin symbol processing", aliases: ["ksp", "kapt"], category: "mobile" },
  { term: "detekt", aliases: ["ktlint"], category: "mobile" },
  { term: "mockk", aliases: ["kotest", "paparazzi"], category: "mobile" },

  // ── Frontend web ─────────────────────────────────────────────────────────────
  // EXCLUIDO: "Hydration" — un CV de enfermería o de deporte habla de hidratación
  // del paciente. Entra como "ssr hydration".
  { term: "css modules", category: "frontend" },
  { term: "react hook form", aliases: ["formik"], category: "frontend" },
  { term: "web vitals", aliases: ["core web vitals", "lcp", "cls"], category: "frontend" },
  { term: "server-side rendering", aliases: ["ssr", "renderizado del lado del servidor"], category: "frontend" },
  { term: "static site generation", aliases: ["ssg", "generacion estatica"], category: "frontend" },
  // Sin alias "hidratacion": en un CV de enfermería es la hidratación del paciente.
  // El alias estuvo mal desde que se escribió y quedó oculto hasta que el matcheo
  // dejó de distinguir acentos — y entonces empezó a etiquetar enfermeras con una
  // técnica de renderizado web.
  { term: "ssr hydration", category: "frontend" },
  { term: "code splitting", aliases: ["division de codigo"], category: "frontend" },
  { term: "lazy loading", aliases: ["carga diferida", "carga perezosa"], category: "frontend" },
  { term: "css grid", aliases: ["grid layout"], category: "frontend" },
  { term: "flexbox", category: "frontend" },
  { term: "micro frontends", aliases: ["microfrontends"], category: "frontend" },

  // ── DevOps / SRE ─────────────────────────────────────────────────────────────
  { term: "elk stack", aliases: ["elasticsearch logstash kibana", "kibana", "logstash"], category: "devops" },
  { term: "incident response", aliases: ["respuesta a incidentes", "gestion de incidentes"], category: "devops" },
  { term: "on-call rotation", aliases: ["guardias", "rotacion de guardias", "on call"], category: "devops" },
  { term: "postmortem analysis", aliases: ["analisis postmortem", "blameless postmortem"], category: "devops" },
  { term: "service level agreement", aliases: ["sla", "acuerdo de nivel de servicio"], category: "devops" },
  { term: "service level objectives", aliases: ["slo", "objetivos de nivel de servicio", "error budget"], category: "devops" },
  { term: "blue-green deployment", aliases: ["despliegue blue green"], category: "devops" },
  { term: "canary release", aliases: ["despliegue canario", "canary deployment"], category: "devops" },
  { term: "infrastructure as code", aliases: ["iac", "infraestructura como codigo"], category: "devops" },
  { term: "service mesh", aliases: ["istio", "linkerd", "malla de servicios"], category: "devops" },
  { term: "chaos engineering", aliases: ["ingenieria del caos"], category: "devops" },
  { term: "capacity planning", aliases: ["planificacion de capacidad"], category: "devops" },
  { term: "disaster recovery", aliases: ["recuperacion ante desastres", "plan de contingencia"], category: "devops" },

  // ── Seguridad ────────────────────────────────────────────────────────────────
  // EXCLUIDO bare: "SOC" — entra como "security operations center" y "soc 2".
  { term: "soc 2", aliases: ["soc2"], category: "cert" },
  { term: "firewall configuration", aliases: ["configuracion de firewall", "reglas de firewall"], category: "devops" },
  { term: "public key infrastructure", aliases: ["pki", "infraestructura de clave publica"], category: "devops" },
  { term: "metasploit", aliases: ["nmap", "wireshark"], category: "devops" },
  { term: "security audits", aliases: ["auditorias de seguridad", "auditoria de seguridad"], category: "devops" },
  { term: "pci dss", aliases: ["pci"], category: "cert" },
  { term: "nist framework", aliases: ["nist"], category: "cert" },
  { term: "secure code review", aliases: ["revision segura de codigo"], category: "devops" },

  // ── Data engineering ─────────────────────────────────────────────────────────
  // EXCLUIDOS: "Stitch" (puntada, costura) y "Presto" (en español significa
  // "pronto"). Presto entra como "presto sql".
  { term: "data pipelines", aliases: ["pipelines de datos", "tuberias de datos"], category: "data" },
  { term: "data governance", aliases: ["gobierno de datos", "gobernanza de datos"], category: "data" },
  { term: "data quality", aliases: ["calidad de datos"], category: "data" },
  { term: "data lake", aliases: ["lago de datos", "lakehouse"], category: "data" },
  { term: "star schema", aliases: ["esquema estrella", "snowflake schema"], category: "data" },
  { term: "slowly changing dimensions", aliases: ["scd"], category: "data" },
  { term: "kimball methodology", aliases: ["metodologia kimball", "inmon"], category: "data" },
  { term: "delta lake", category: "data" },
  { term: "amazon kinesis", aliases: ["kinesis"], category: "data" },
  { term: "presto sql", aliases: ["trino"], category: "data" },
  { term: "fivetran", aliases: ["airbyte"], category: "data" },
  { term: "data catalog", aliases: ["catalogo de datos"], category: "data" },
  { term: "master data management", aliases: ["gestion de datos maestros"], category: "data" },

  // ── Marketing ────────────────────────────────────────────────────────────────
  { term: "social media marketing", aliases: ["marketing en redes sociales", "gestion de redes sociales", "community management", "social media management", "gestión de redes sociales"], category: "marketing" },
  { term: "media buying", aliases: ["compra de medios", "planificacion de medios"], category: "marketing" },
  { term: "landing page optimization", aliases: ["optimizacion de landing pages"], category: "marketing" },
  { term: "attribution modeling", aliases: ["modelo de atribucion"], category: "marketing" },
  { term: "customer segmentation", aliases: ["segmentacion de clientes"], category: "marketing" },
  { term: "lead nurturing", aliases: ["nutricion de leads", "maduracion de leads"], category: "marketing" },
  { term: "marketing funnel", aliases: ["embudo de marketing"], category: "marketing" },

  // ── Ventas ───────────────────────────────────────────────────────────────────
  // EXCLUIDO bare: "Prospecting" — entra como "sales prospecting" (en minería
  // "prospecting" es prospección de minerales).
  { term: "sales prospecting", aliases: ["prospeccion comercial", "prospeccion de clientes"], category: "sales" },
  { term: "lead qualification", aliases: ["calificacion de leads", "bant", "meddic"], category: "sales" },
  { term: "spin selling", aliases: ["solution selling", "venta consultiva"], category: "sales" },
  { term: "key account management", aliases: ["gestion de cuentas clave", "kam"], category: "sales" },
  { term: "sales forecasting", aliases: ["pronostico de ventas", "forecast de ventas"], category: "sales" },
  { term: "closing techniques", aliases: ["tecnicas de cierre", "cierre de ventas"], category: "sales" },
  { term: "customer retention", aliases: ["retencion de clientes", "fidelizacion de clientes"], category: "sales" },
  { term: "quota attainment", aliases: ["cumplimiento de cuota", "logro de cuota"], category: "sales" },
  { term: "territory management", aliases: ["gestion de territorio"], category: "sales" },

  // ── Finanzas ─────────────────────────────────────────────────────────────────
  // EXCLUIDO bare: "Audit" — entra como "financial audit"; "auditoría" a secas
  // aparece en demasiados contextos que no son la habilidad.
  { term: "discounted cash flow", aliases: ["dcf", "flujo de caja descontado"], category: "finance" },
  { term: "tax compliance", aliases: ["cumplimiento tributario", "cumplimiento fiscal"], category: "finance" },
  { term: "financial audit", aliases: ["auditoria financiera"], category: "finance" },
  { term: "internal controls", aliases: ["controles internos", "sox"], category: "finance" },
  { term: "oracle financials", aliases: ["oracle erp"], category: "finance" },
  { term: "xero", category: "finance" },
  { term: "risk management", aliases: ["gestion de riesgos", "administracion de riesgos"], category: "finance" },

  // ── RRHH ─────────────────────────────────────────────────────────────────────
  { term: "talent sourcing", aliases: ["sourcing de talento", "busqueda de talento"], category: "hr" },
  { term: "applicant tracking systems", aliases: ["ats", "sistema de seguimiento de candidatos"], category: "hr" },
  { term: "employer branding", aliases: ["marca empleadora"], category: "hr" },
  { term: "diversity and inclusion", aliases: ["diversidad e inclusion", "dei"], category: "hr" },
  { term: "exit interviews", aliases: ["entrevistas de salida"], category: "hr" },
  { term: "workforce planning", aliases: ["planificacion de plantilla", "planificacion de personal"], category: "hr" },

  // ── Salud ────────────────────────────────────────────────────────────────────
  { term: "iv insertion", aliases: ["canalizacion venosa", "venopuncion", "insercion de via", "venipuncture", "venopunción"], category: "healthcare" },
  { term: "catheterization", aliases: ["cateterismo", "sondaje vesical"], category: "healthcare" },
  { term: "patient charting", aliases: ["registro clinico", "notas de enfermeria", "historia clinica", "clinical documentation", "documentación clínica", "historia clínica", "charting"], category: "healthcare" },
  { term: "surgical assistance", aliases: ["instrumentacion quirurgica", "asistencia quirurgica", "surgical assisting", "instrumentación quirúrgica"], category: "healthcare" },
  { term: "anesthesia monitoring", aliases: ["monitoreo anestesico"], category: "healthcare" },
  { term: "palliative care", aliases: ["cuidados paliativos"], category: "healthcare" },
  { term: "mental health first aid", aliases: ["primeros auxilios psicologicos", "contencion emocional"], category: "healthcare" },
  { term: "occupational therapy", aliases: ["terapia ocupacional"], category: "healthcare" },
  { term: "laboratory testing", aliases: ["analisis de laboratorio", "pruebas de laboratorio"], category: "healthcare" },
  { term: "specimen collection", aliases: ["toma de muestras", "recoleccion de muestras"], category: "healthcare" },
  { term: "nutrition counseling", aliases: ["consejeria nutricional", "asesoria nutricional"], category: "healthcare" },
  { term: "dialysis", aliases: ["hemodialisis", "dialisis"], category: "healthcare" },

  // ── Educación ────────────────────────────────────────────────────────────────
  // EXCLUIDO bare: "Grading" — en construcción es la nivelación del terreno.
  { term: "iep development", aliases: ["plan educativo individualizado", "adaptaciones curriculares"], category: "education" },
  { term: "summative assessment", aliases: ["evaluacion sumativa"], category: "education" },
  { term: "blended learning", aliases: ["aprendizaje mixto", "modalidad hibrida"], category: "education" },
  { term: "learning management systems", aliases: ["lms", "moodle", "plataforma educativa"], category: "education" },
  { term: "educational technology", aliases: ["tecnologia educativa", "edtech"], category: "education" },
  { term: "literacy instruction", aliases: ["alfabetizacion", "ensenanza de la lectura"], category: "education" },
  { term: "adult education", aliases: ["educacion de adultos", "andragogia"], category: "education" },
  { term: "student grading", aliases: ["calificacion de estudiantes", "correccion de examenes"], category: "education" },

  // ── Legal ────────────────────────────────────────────────────────────────────
  { term: "contract review", aliases: ["revision de contratos"], category: "legal" },
  { term: "litigation support", aliases: ["apoyo en litigios", "soporte litigioso"], category: "legal" },
  { term: "mergers and acquisitions", aliases: ["fusiones y adquisiciones", "m&a"], category: "legal" },
  { term: "deposition preparation", aliases: ["preparacion de declaraciones"], category: "legal" },
  { term: "court filings", aliases: ["presentaciones judiciales", "escritos judiciales"], category: "legal" },
  { term: "notarization", aliases: ["fe notarial", "protocolizacion"], category: "legal" },
  { term: "mediation", aliases: ["mediacion", "conciliacion"], category: "legal" },
  { term: "arbitration", aliases: ["arbitraje"], category: "legal" },
  { term: "regulatory affairs", aliases: ["asuntos regulatorios"], category: "legal" },
  { term: "legal discovery", aliases: ["exhibicion de pruebas", "discovery"], category: "legal" },

  // ── Oficios ──────────────────────────────────────────────────────────────────
  // EXCLUIDO bare: "Painting" — pintar la oficina no es el oficio. Entra como
  // "industrial painting". Y "soldering" NO lleva el alias "soldadura": en español
  // esa palabra ya es welding, y confundirlas cambia el oficio del candidato.
  { term: "mig welding", aliases: ["soldadura mig"], category: "industry" },
  { term: "tig welding", aliases: ["soldadura tig"], category: "industry" },
  { term: "electrical installation", aliases: ["instalacion electrica", "instalaciones electricas", "electrical wiring", "instalaciones eléctricas", "cableado electrico"], category: "industry" },
  { term: "masonry", aliases: ["albanileria", "mamposteria"], category: "industry" },
  { term: "roofing", aliases: ["techado", "cubiertas"], category: "industry" },
  { term: "heavy equipment operation", aliases: ["operacion de maquinaria pesada", "retroexcavadora"], category: "industry" },
  { term: "troubleshooting", aliases: ["diagnostico de fallas", "resolucion de averias"], category: "industry" },
  { term: "hydraulics", aliases: ["hidraulica", "sistemas hidraulicos"], category: "industry" },
  { term: "pneumatics", aliases: ["neumatica", "sistemas neumaticos"], category: "industry" },
  { term: "plc programming", aliases: ["programacion de plc", "automatizacion industrial", "scada"], category: "industry" },
  { term: "machining", aliases: ["mecanizado", "torneria", "fresado"], category: "industry" },
  { term: "soldering", aliases: ["soldadura de componentes", "soldadura electronica"], category: "industry" },
  { term: "scaffolding", aliases: ["andamios", "montaje de andamios"], category: "industry" },
  { term: "concrete work", aliases: ["hormigon", "vaciado de hormigon", "encofrado"], category: "industry" },
  { term: "safety inspections", aliases: ["inspecciones de seguridad", "checklist de seguridad"], category: "industry" },
  { term: "lockout tagout", aliases: ["bloqueo y etiquetado", "loto"], category: "industry" },

  // ── Hostelería ───────────────────────────────────────────────────────────────
  { term: "food preparation", aliases: ["preparacion de alimentos", "mise en place"], category: "operations" },
  { term: "cost control", aliases: ["control de costos", "control de mermas"], category: "operations" },
  { term: "table service", aliases: ["atencion de mesas", "servicio de mesa"], category: "operations" },
  { term: "guest relations", aliases: ["atencion al huesped", "relacion con huespedes"], category: "operations" },
  { term: "reservation systems", aliases: ["sistema de reservas", "gestion de reservas", "reservations", "gestión de reservas"], category: "operations" },
  { term: "wine pairing", aliases: ["maridaje", "sommelier"], category: "operations" },
  { term: "kitchen management", aliases: ["gestion de cocina", "jefe de cocina"], category: "operations" },
  { term: "portion control", aliases: ["control de porciones", "estandarizacion de recetas"], category: "operations" },
  { term: "allergen management", aliases: ["gestion de alergenos", "control de alergenos"], category: "operations" },
  { term: "shift scheduling", aliases: ["elaboracion de turnos", "planificacion de turnos"], category: "operations" },

  // ── Logística ────────────────────────────────────────────────────────────────
  { term: "customs clearance", aliases: ["despacho aduanero", "gestion aduanera"], category: "operations" },
  { term: "freight forwarding", aliases: ["gestion de carga internacional", "agente de carga"], category: "operations" },
  { term: "order fulfillment", aliases: ["preparacion de pedidos", "cumplimiento de pedidos"], category: "operations" },
  { term: "picking and packing", aliases: ["picking", "packing", "preparacion y embalaje"], category: "operations" },
  { term: "cycle counting", aliases: ["conteo ciclico", "inventario ciclico"], category: "operations" },
  { term: "demand planning", aliases: ["planificacion de la demanda", "pronostico de demanda"], category: "operations" },
  { term: "vendor management", aliases: ["gestion de proveedores", "relacion con proveedores"], category: "operations" },
  { term: "cold chain", aliases: ["cadena de frio"], category: "operations" },
  { term: "last mile delivery", aliases: ["ultima milla", "reparto de ultima milla"], category: "operations" },
  { term: "warehouse management system", aliases: ["wms", "sistema de gestion de almacen"], category: "operations" },
  { term: "kaizen", aliases: ["mejora continua"], category: "operations" },
  { term: "5s methodology", aliases: ["metodologia 5s", "5s"], category: "operations" },

  // ── Atención al cliente ──────────────────────────────────────────────────────
  { term: "ticketing systems", aliases: ["sistema de tickets", "zendesk", "freshdesk", "jira service desk"], category: "operations" },
  { term: "live chat support", aliases: ["soporte por chat", "chat en vivo"], category: "operations" },
  { term: "complaint handling", aliases: ["gestion de reclamos", "manejo de quejas"], category: "operations" },
  { term: "escalation management", aliases: ["gestion de escalamientos", "escalamiento de casos"], category: "operations" },
  { term: "first call resolution", aliases: ["resolucion en primer contacto", "fcr"], category: "operations" },
  { term: "customer satisfaction", aliases: ["satisfaccion del cliente", "csat"], category: "operations" },
  { term: "net promoter score", aliases: ["nps"], category: "operations" },
  { term: "service level management", aliases: ["gestion de niveles de servicio"], category: "operations" },
  { term: "knowledge base", aliases: ["base de conocimiento", "documentacion de soporte"], category: "operations" },
  { term: "technical support", aliases: ["soporte tecnico", "help desk", "mesa de ayuda"], category: "operations" },

  // ── Administración ───────────────────────────────────────────────────────────
  // EXCLUIDO bare: "Reception" — "recepción de mercadería" es logística, no
  // recepcionista. Entra como "front desk reception".
  { term: "document management", aliases: ["gestion documental", "archivo de documentos"], category: "operations" },
  { term: "meeting minutes", aliases: ["actas de reunion", "redaccion de actas", "minute taking", "actas de reunión"], category: "operations" },
  { term: "office management", aliases: ["gestion de oficina", "administracion de oficina"], category: "operations" },
  { term: "filing systems", aliases: ["sistemas de archivo", "clasificacion documental"], category: "operations" },
  { term: "petty cash", aliases: ["caja chica", "fondo fijo"], category: "finance" },
  { term: "expense reports", aliases: ["rendicion de gastos", "informes de gastos"], category: "finance" },
  { term: "front desk reception", aliases: ["recepcionista", "atencion en recepcion", "front desk", "recepcion de hotel", "recepción de hotel"], category: "operations" },
  { term: "correspondence management", aliases: ["gestion de correspondencia"], category: "operations" },
  { term: "transcription", aliases: ["transcripcion", "desgrabacion"], category: "operations" },

  // ── Gaming / Embebidos ───────────────────────────────────────────────────────
  { term: "physics engines", aliases: ["motores de fisica"], category: "backend" },
  { term: "multiplayer networking", aliases: ["networking multijugador", "netcode"], category: "backend" },
  { term: "embedded c", aliases: ["c embebido", "programacion embebida"], category: "backend" },
  { term: "rtos", aliases: ["freertos", "sistema operativo de tiempo real"], category: "backend" },
  { term: "firmware development", aliases: ["desarrollo de firmware"], category: "backend" },
  { term: "microcontrollers", aliases: ["microcontroladores", "stm32", "esp32"], category: "backend" },
  { term: "arduino", aliases: ["raspberry pi"], category: "backend" },
  { term: "can bus", aliases: ["bus can"], category: "backend" },
  { term: "i2c protocol", aliases: ["i2c", "spi protocol", "uart"], category: "backend" },
  { term: "signal processing", aliases: ["procesamiento de senales", "dsp"], category: "backend" },
  { term: "pcb design", aliases: ["diseno de pcb", "altium", "kicad"], category: "backend" },
];

/**
 * Precomputed lowercase term → SkillEntry map (term + aliases all included).
 * Allows O(1) keyword lookup during analysis.
 */
const SKILL_LOOKUP = new Map<string, SkillEntry>();
for (const skill of ATS_SKILLS) {
  // Keyed with accents folded: the Spanish half of this dictionary is written
  // with them ("gestión de proyectos") and users type it both ways. Keying on
  // the raw string meant "gestion de proyectos" was an unknown skill, which is
  // exactly the spelling most people use.
  for (const form of [skill.term, ...(skill.aliases ?? [])]) {
    SKILL_LOOKUP.set(foldAccentsLower(form), skill);
  }
}

export function findSkill(term: string): SkillEntry | undefined {
  return SKILL_LOOKUP.get(foldAccentsLower(term));
}

export function isKnownSkill(term: string): boolean {
  return SKILL_LOOKUP.has(foldAccentsLower(term));
}

/** All searchable forms (canonical + aliases) for full-text scanning. */
export function allSkillForms(): string[] {
  return Array.from(SKILL_LOOKUP.keys());
}
