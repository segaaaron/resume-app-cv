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
    | "tools";
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
  { term: "rest", aliases: ["rest api", "restful"], category: "backend" },
  { term: "microservices", aliases: ["microservicios"], category: "backend" },
  { term: "grpc", category: "backend" },
  { term: "websockets", category: "backend" },

  // Mobile
  { term: "react native", category: "mobile" },
  { term: "flutter", category: "mobile" },
  { term: "ios", category: "mobile" },
  { term: "android", category: "mobile" },
  { term: "swiftui", category: "mobile" },
  { term: "jetpack compose", category: "mobile" },
  { term: "xamarin", category: "mobile" },

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
