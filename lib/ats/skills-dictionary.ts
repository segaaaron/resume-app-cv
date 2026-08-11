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
  { term: "spring", aliases: ["spring boot"], category: "backend" },
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
  { term: "indesign", category: "design" },
  { term: "after effects", category: "design" },
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
  { term: "monday.com", aliases: ["monday"], category: "pm" },
  { term: "linear", category: "pm" },
  { term: "product management", aliases: ["gestión de producto"], category: "pm" },
  { term: "project management", aliases: ["gestión de proyectos"], category: "pm" },
  { term: "stakeholder management", aliases: ["gestión de stakeholders"], category: "pm" },
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
  { term: "spring boot", category: "backend" },
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
  { term: "istio", category: "devops" },
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
  { term: "lightroom", category: "design" },
  { term: "affinity designer", category: "design" },
  { term: "affinity photo", category: "design" },
  { term: "motion graphics", category: "design" },
  { term: "branding", aliases: ["brand identity"], category: "design" },
  { term: "typography", category: "design" },
  { term: "color theory", category: "design" },
  { term: "layout design", category: "design" },
  { term: "print design", category: "design" },
  { term: "packaging design", category: "design" },
  { term: "3d modeling", category: "design" },
  { term: "animation", category: "design" },
  { term: "storyboarding", category: "design" },
  { term: "logo design", category: "design" },
  { term: "art direction", category: "design" },
  { term: "visual design", category: "design" },
  { term: "illustration", category: "design" },
  // Healthcare — nursing / clinical
  { term: "patient care", aliases: ["atención al paciente", "cuidado del paciente"], category: "healthcare" },
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
  { term: "clinical documentation", aliases: ["documentación clínica", "historia clínica", "charting"], category: "healthcare" },
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
  { term: "moodle", category: "education" },
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
  { term: "regulatory compliance", category: "legal" },
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
  { term: "storyboards", aliases: ["storyboard"], category: "mobile" },
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
  { term: "content providers", category: "mobile" },
  { term: "broadcast receivers", category: "mobile" },
  { term: "foreground services", category: "mobile" },
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
  { term: "core web vitals", category: "frontend" },
  { term: "responsive design", aliases: ["diseno responsivo", "diseño responsivo", "responsive web design"], category: "frontend" },

  // Backend
  { term: "symfony", category: "backend" },
  { term: "asp.net core", aliases: ["aspnet core"], category: "backend" },
  { term: "phoenix framework", category: "backend" },
  { term: "entity framework", aliases: ["ef core"], category: "backend" },
  { term: "message queues", aliases: ["colas de mensajes"], category: "backend" },
  { term: "cron jobs", aliases: ["tareas programadas"], category: "backend" },

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
  { term: "security operations center", aliases: ["soc analyst"], category: "industry" },
  { term: "iso 27001", category: "cert" },
  { term: "gdpr", aliases: ["rgpd"], category: "legal" },
  { term: "encryption", aliases: ["cifrado", "encriptacion", "encriptación"], category: "industry" },
  { term: "ssl/tls", aliases: ["tls"], category: "industry" },
  { term: "zero trust", category: "industry" },
  { term: "identity and access management", aliases: ["iam", "gestion de identidades", "gestión de identidades"], category: "industry" },
  { term: "multi-factor authentication", aliases: ["mfa", "autenticacion multifactor", "autenticación multifactor"], category: "industry" },
  { term: "vulnerability assessment", aliases: ["analisis de vulnerabilidades", "análisis de vulnerabilidades"], category: "industry" },

  // QA / testing
  { term: "manual testing", aliases: ["pruebas manuales"], category: "tools" },
  { term: "test automation", aliases: ["automation testing", "automatizacion de pruebas", "automatización de pruebas"], category: "tools" },
  { term: "appium", category: "tools" },
  { term: "load testing", aliases: ["pruebas de carga"], category: "tools" },
  { term: "k6", category: "tools" },
  { term: "jmeter", aliases: ["apache jmeter"], category: "tools" },
  { term: "test plans", aliases: ["plan de pruebas"], category: "tools" },
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
  { term: "venipuncture", aliases: ["venopuncion", "venopunción"], category: "healthcare" },
  { term: "catheter care", aliases: ["cuidado de cateter", "cuidado de catéter"], category: "healthcare" },
  { term: "care plans", aliases: ["planes de cuidado"], category: "healthcare" },
  { term: "discharge planning", aliases: ["planificacion del alta", "planificación del alta"], category: "healthcare" },
  { term: "geriatric care", aliases: ["cuidado geriatrico", "cuidado geriátrico", "geriatria", "geriatría"], category: "healthcare" },
  { term: "pediatric care", aliases: ["cuidado pediatrico", "cuidado pediátrico", "pediatria", "pediatría"], category: "healthcare" },
  { term: "mental health", aliases: ["salud mental"], category: "healthcare" },
  { term: "physical therapy", aliases: ["fisioterapia", "terapia fisica", "terapia física"], category: "healthcare" },
  { term: "radiology", aliases: ["radiologia", "radiología"], category: "healthcare" },
  { term: "ultrasound", aliases: ["ecografia", "ecografía"], category: "healthcare" },
  { term: "surgical assisting", aliases: ["instrumentacion quirurgica", "instrumentación quirúrgica"], category: "healthcare" },
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
  { term: "regulatory compliance", aliases: ["compliance", "cumplimiento normativo"], category: "legal" },
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
  { term: "social media management", aliases: ["gestion de redes sociales", "gestión de redes sociales", "community management"], category: "marketing" },
  { term: "market research", aliases: ["investigacion de mercado", "investigación de mercado"], category: "marketing" },
  { term: "influencer marketing", aliases: ["marketing de influencers"], category: "marketing" },

  // Trades / operations / logistics
  { term: "plumbing", aliases: ["plomeria", "plomería", "gasfiteria", "fontaneria"], category: "operations" },
  { term: "electrical wiring", aliases: ["instalaciones electricas", "instalaciones eléctricas", "cableado electrico"], category: "operations" },
  { term: "preventive maintenance", aliases: ["mantenimiento preventivo"], category: "operations" },
  { term: "supply chain", aliases: ["cadena de suministro"], category: "operations" },
  { term: "route planning", aliases: ["planificacion de rutas", "planificación de rutas"], category: "operations" },
  { term: "heavy machinery", aliases: ["maquinaria pesada"], category: "operations" },
  { term: "carpentry", aliases: ["carpinteria", "carpintería"], category: "operations" },
  { term: "industrial painting", aliases: ["pintura industrial"], category: "operations" },

  // Hospitality
  { term: "menu planning", aliases: ["planificacion de menus", "planificación de menús"], category: "operations" },
  { term: "bartending", aliases: ["bartender", "cocteleria", "coctelería"], category: "operations" },
  { term: "barista", category: "operations" },
  { term: "inventory control", aliases: ["control de inventario"], category: "operations" },
  { term: "catering", aliases: ["banquetes"], category: "operations" },
  { term: "event planning", aliases: ["organizacion de eventos", "organización de eventos"], category: "operations" },
  { term: "front desk", aliases: ["recepcion de hotel", "recepción de hotel", "atencion en recepcion"], category: "operations" },
  { term: "housekeeping", aliases: ["ama de llaves"], category: "operations" },
  { term: "reservations", aliases: ["gestion de reservas", "gestión de reservas"], category: "operations" },
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
  { term: "minute taking", aliases: ["actas de reunion", "actas de reunión"], category: "operations" },

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
