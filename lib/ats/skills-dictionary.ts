/**
 * ATS Skills Dictionary
 * Curated ~250 skill keywords for keyword matching boost in ATS analyzer.
 * Bilingual where the term differs in Spanish; brand/tech names are universal.
 *
 * Each entry: canonical term (lowercase) + aliases (variants/translations).
 * Matching is case-insensitive on both sides.
 */

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
  { term: "express", aliases: ["expressjs"], category: "backend" },
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
  { term: "photoshop", category: "design" },
  { term: "illustrator", category: "design" },
  { term: "indesign", category: "design" },
  { term: "after effects", category: "design" },
  { term: "premiere", category: "design" },
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
  { term: "budgeting", aliases: ["presupuestación"], category: "finance" },
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
  { term: "patient care", category: "healthcare" },
  { term: "ehr", aliases: ["electronic health records"], category: "healthcare" },
  { term: "emr", aliases: ["electronic medical records"], category: "healthcare" },
  { term: "epic systems", category: "healthcare" },
  { term: "cerner", category: "healthcare" },
  { term: "meditech", category: "healthcare" },
  { term: "cpr", category: "healthcare" },
  { term: "bls", aliases: ["basic life support"], category: "healthcare" },
  { term: "acls", aliases: ["advanced cardiac life support"], category: "healthcare" },
  { term: "pals", category: "healthcare" },
  { term: "phlebotomy", category: "healthcare" },
  { term: "triage", category: "healthcare" },
  { term: "vital signs", category: "healthcare" },
  { term: "iv therapy", category: "healthcare" },
  { term: "wound care", category: "healthcare" },
  { term: "medication administration", category: "healthcare" },
  { term: "hipaa", category: "healthcare" },
  { term: "patient assessment", category: "healthcare" },
  { term: "care planning", category: "healthcare" },
  { term: "infection control", category: "healthcare" },
  { term: "first aid", category: "healthcare" },
  { term: "clinical documentation", category: "healthcare" },
  { term: "ekg", aliases: ["ecg"], category: "healthcare" },
  { term: "acute care", category: "healthcare" },
  { term: "telemetry", category: "healthcare" },
  { term: "clinical diagnosis", category: "healthcare" },
  { term: "telemedicine", category: "healthcare" },
  { term: "icd-10", category: "healthcare" },
  { term: "cpt coding", category: "healthcare" },
  { term: "medical coding", category: "healthcare" },
  { term: "pharmacology", category: "healthcare" },
  { term: "case management", category: "healthcare" },
  // Education
  { term: "lesson planning", category: "education" },
  { term: "curriculum development", category: "education" },
  { term: "classroom management", category: "education" },
  { term: "differentiated instruction", category: "education" },
  { term: "google classroom", category: "education" },
  { term: "canvas lms", aliases: ["canvas"], category: "education" },
  { term: "blackboard", category: "education" },
  { term: "moodle", category: "education" },
  { term: "student assessment", category: "education" },
  { term: "iep", aliases: ["individualized education program"], category: "education" },
  { term: "special education", category: "education" },
  { term: "instructional design", category: "education" },
  { term: "e-learning", category: "education" },
  { term: "tutoring", category: "education" },
  // Legal
  { term: "legal research", category: "legal" },
  { term: "contract drafting", category: "legal" },
  { term: "litigation", category: "legal" },
  { term: "due diligence", category: "legal" },
  { term: "westlaw", category: "legal" },
  { term: "lexisnexis", category: "legal" },
  { term: "legal writing", category: "legal" },
  { term: "regulatory compliance", category: "legal" },
  { term: "intellectual property", category: "legal" },
  { term: "corporate law", category: "legal" },
  { term: "contract negotiation", category: "legal" },
  { term: "e-discovery", category: "legal" },
  // Operations / trades / hospitality
  { term: "supply chain management", category: "operations" },
  { term: "inventory management", category: "operations" },
  { term: "procurement", category: "operations" },
  { term: "quality control", category: "operations" },
  { term: "lean manufacturing", category: "operations" },
  { term: "warehouse management", category: "operations" },
  { term: "forklift operation", category: "operations" },
  { term: "welding", category: "operations" },
  { term: "cnc machining", aliases: ["cnc"], category: "operations" },
  { term: "blueprint reading", category: "operations" },
  { term: "hvac", category: "operations" },
  { term: "osha", category: "operations" },
  { term: "food safety", category: "operations" },
  { term: "servsafe", category: "operations" },
  { term: "pos systems", aliases: ["point of sale"], category: "operations" },
  { term: "customer service", category: "operations" },
  { term: "culinary arts", category: "operations" },
  { term: "fleet management", category: "operations" },
];

/**
 * Precomputed lowercase term → SkillEntry map (term + aliases all included).
 * Allows O(1) keyword lookup during analysis.
 */
const SKILL_LOOKUP = new Map<string, SkillEntry>();
for (const skill of ATS_SKILLS) {
  SKILL_LOOKUP.set(skill.term, skill);
  for (const alias of skill.aliases ?? []) {
    SKILL_LOOKUP.set(alias.toLowerCase(), skill);
  }
}

export function findSkill(term: string): SkillEntry | undefined {
  return SKILL_LOOKUP.get(term.toLowerCase());
}

export function isKnownSkill(term: string): boolean {
  return SKILL_LOOKUP.has(term.toLowerCase());
}

/** All searchable forms (canonical + aliases) for full-text scanning. */
export function allSkillForms(): string[] {
  return Array.from(SKILL_LOOKUP.keys());
}
