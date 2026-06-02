// Datos para el post ES `cv-sin-experiencia`: 8 ejemplos completos por área
// profesional, objetivos profesionales por sector, habilidades técnicas y
// blandas valoradas sin experiencia formal.

export type EjemploCVSinExperiencia = {
  id: string
  area: string
  perfil: string
  seccionEstrella: string
  objetivoEjemplo: string
  habilidadesClave: string[]
  proyectosVoluntariadoTip: string
}

export const EJEMPLOS_CV_SIN_EXPERIENCIA: EjemploCVSinExperiencia[] = [
  {
    id: "tech",
    area: "Tecnología — Desarrollador Junior",
    perfil: "Recién egresado de programación o autodidacta con bootcamp completado",
    seccionEstrella: "Proyectos personales en GitHub con README detallado",
    objetivoEjemplo:
      "Desarrollador Full-Stack recién certificado por Platzi y bootcamp Henry, con 4 proyectos personales en producción usando React, Node.js y PostgreSQL. Busco mi primer rol como Desarrollador Junior donde aplicar mis conocimientos en arquitectura backend y testing.",
    habilidadesClave: [
      "JavaScript / TypeScript",
      "React / Next.js",
      "Node.js / Express",
      "Git / GitHub",
      "SQL / PostgreSQL",
      "Testing (Jest)",
    ],
    proyectosVoluntariadoTip:
      "Contribuciones open-source documentadas, hackathones con premio o mención, README profesional con screenshots y demo en vivo.",
  },
  {
    id: "marketing",
    area: "Marketing Digital — Asistente",
    perfil: "Estudiante de Comunicación o Marketing con certificaciones online + proyecto personal",
    seccionEstrella: "Portfolio de campañas con métricas (engagement, alcance, CTR)",
    objetivoEjemplo:
      "Estudiante de último año de Comunicación Audiovisual con certificaciones Google Analytics y Meta Blueprint. Gestiono una cuenta de Instagram de +8K seguidores en nicho de bienestar con 6.2% engagement. Busco rol de Asistente de Marketing Digital donde aplicar mis habilidades en SEO, content marketing y analítica.",
    habilidadesClave: [
      "Google Analytics 4",
      "Meta Ads / TikTok Ads",
      "SEO básico",
      "Canva / Figma",
      "HubSpot CRM",
      "Notion / Asana",
    ],
    proyectosVoluntariadoTip:
      "Gestión de redes propias con audiencia medible, manejo de pauta para campañas familiares/amigos, certificaciones Google + Meta Blueprint.",
  },
  {
    id: "administracion",
    area: "Administración / Finanzas — Asistente Administrativo",
    perfil: "Sin experiencia laboral pero con cursos sólidos y manejo Excel avanzado",
    seccionEstrella: "Certificaciones Excel intermedio/avanzado + cursos en NIIF o contabilidad",
    objetivoEjemplo:
      "Recién egresada de Contaduría con certificación Excel Avanzado (Microsoft Office Specialist) y curso de NIIF aplicado. Manejo modelos financieros, conciliaciones bancarias y reportería ejecutiva desde proyectos académicos. Busco rol de Asistente Administrativo donde aplicar mi rigor analítico y conocimiento contable.",
    habilidadesClave: [
      "Excel avanzado (tablas dinámicas, Power Query)",
      "SAP básico",
      "QuickBooks",
      "Conciliaciones bancarias",
      "Reportería ejecutiva",
      "NIIF / IFRS",
    ],
    proyectosVoluntariadoTip:
      "Manejo voluntario de contabilidad de organizaciones estudiantiles, modelos financieros personales documentados, certificación Bloomberg Market Concepts (gratis).",
  },
  {
    id: "salud",
    area: "Salud — Enfermera/o Junior o Auxiliar",
    perfil: "Estudiante de enfermería con prácticas hospitalarias documentadas",
    seccionEstrella: "Prácticas hospitalarias detalladas por área (UCI, urgencias, pediatría) con procedimientos",
    objetivoEjemplo:
      "Egresada de Enfermería Técnica con 720 horas de práctica clínica en áreas de UCI, urgencias y pediatría, certificada en RCP y BLS. Busco rol como Enfermera/o Junior donde aplicar mi formación en atención al paciente y protocolos hospitalarios bajo supervisión profesional.",
    habilidadesClave: [
      "Atención directa al paciente",
      "RCP / BLS / ACLS",
      "Sistemas EMR (Epic, Cerner básico)",
      "Protocolos de bioseguridad",
      "Toma de signos vitales",
      "Administración de medicamentos",
    ],
    proyectosVoluntariadoTip:
      "Voluntariados en campañas de salud pública (vacunación, jornadas comunitarias), certificación adicional en primeros auxilios psicológicos, idioma inglés B1+ valorado.",
  },
  {
    id: "educacion",
    area: "Educación / Docencia — Docente Recién Titulado",
    perfil: "Estudiante de Pedagogía o Licenciatura con prácticas profesionales en aula",
    seccionEstrella: "Prácticas profesionales con curso, nivel, número de alumnos y materiales propios diseñados",
    objetivoEjemplo:
      "Licenciada en Educación Primaria con 240 horas de práctica docente en aula de 3° básico (28 alumnos), especializada en metodologías activas y evaluación formativa. Manejo Moodle y Google Classroom. Busco rol como Docente de Primaria donde aplicar mi enfoque en diferenciación instruccional.",
    habilidadesClave: [
      "Diseño de clases por objetivos",
      "Moodle / Google Classroom",
      "Evaluación formativa",
      "Diferenciación instruccional",
      "Gestión de aula",
      "Material didáctico (Canva, Genially)",
    ],
    proyectosVoluntariadoTip:
      "Voluntariado en programas de tutoría infantil con métricas (X niños beneficiados), materiales pedagógicos propios publicados en redes, certificación en NEE o trastornos del aprendizaje.",
  },
  {
    id: "diseno",
    area: "Diseño Gráfico / UX — Diseñador Junior",
    perfil: "Estudiante de Diseño con portfolio personal y trabajos freelance puntuales",
    seccionEstrella: "Portfolio en Behance, Dribbble o sitio propio — 5-8 proyectos con case study",
    objetivoEjemplo:
      "Estudiante de Diseño Gráfico con portfolio de 8 proyectos de branding y UX completos, dominio de Figma, Adobe Illustrator y Photoshop. Realicé identidad visual freelance para 4 pequeños negocios locales. Busco rol como Diseñador Junior donde aplicar mi pensamiento sistemático y enfoque en research.",
    habilidadesClave: [
      "Figma / Adobe XD",
      "Adobe Illustrator / Photoshop",
      "Design systems básico",
      "Branding e identidad visual",
      "User research básico",
      "Prototipado interactivo",
    ],
    proyectosVoluntariadoTip:
      "Trabajo freelance para emprendimientos locales (logos, social media kit), participación en bootcamps de UX (Google UX Design, EBAC), rediseños voluntarios de productos reales con case study.",
  },
  {
    id: "atencion-cliente",
    area: "Atención al Cliente — Sin Experiencia Formal",
    perfil: "Sin trabajo formal pero con voluntariado en servicio o atención al público",
    seccionEstrella: "Voluntariado con métricas + habilidades blandas demostradas con contexto",
    objetivoEjemplo:
      "Recién egresado de bachiller con 240 horas de voluntariado en orientación turística (atención a +400 turistas), nivel inglés B2 y manejo de POS básico. Busco rol como Asistente de Atención al Cliente donde aplicar mis habilidades en resolución de conflictos y comunicación multicultural.",
    habilidadesClave: [
      "Comunicación oral en español + inglés B2",
      "Resolución de conflictos",
      "Sistemas POS básicos",
      "Microsoft Office",
      "Empatía y escucha activa",
      "Manejo de objeciones",
    ],
    proyectosVoluntariadoTip:
      "Voluntariado en organizaciones con interacción al público (turismo, eventos, ONG), certificación en idiomas con examen oficial (TOEFL, IELTS, DELE), curso corto en customer success o atención al cliente.",
  },
  {
    id: "logistica",
    area: "Logística / Operaciones — Asistente",
    perfil: "Recién egresado de carrera técnica o universitaria sin experiencia laboral formal",
    seccionEstrella: "Proyectos académicos de cadena de suministro + conocimiento de software ERP",
    objetivoEjemplo:
      "Recién egresado de Ingeniería Industrial con proyecto final en optimización de cadena de suministro (reducción simulada de 18% en lead time), conocimiento básico de SAP módulo MM y manejo Excel avanzado. Busco rol como Asistente de Logística donde aplicar mi formación en planificación y mejora continua.",
    habilidadesClave: [
      "Excel avanzado",
      "SAP básico (módulo MM)",
      "Lean Six Sigma Yellow Belt",
      "AutoCAD básico",
      "Gestión de inventarios",
      "KPIs operativos",
    ],
    proyectosVoluntariadoTip:
      "Proyecto final académico cuantificado con métricas reales, certificación Lean Six Sigma Yellow Belt (gratis online), prácticas profesionales en almacén o operaciones aunque sean cortas.",
  },
]

export const HABILIDADES_TECNICAS_QUE_VALEN: { area: string; herramientas: string[]; razon: string }[] = [
  {
    area: "Productividad y ofimática",
    herramientas: ["Excel avanzado", "Google Workspace", "Notion", "Asana", "Trello"],
    razon: "El 80% de roles administrativos las requieren — saberlas bien compensa años de experiencia laboral.",
  },
  {
    area: "Diseño y contenido",
    herramientas: ["Canva", "Figma", "Adobe Photoshop", "CapCut", "Adobe Premiere"],
    razon: "Convierten cualquier perfil en candidato útil para marketing, comunicaciones o branding.",
  },
  {
    area: "Programación básica",
    herramientas: ["HTML/CSS", "SQL básico", "Python para análisis", "Excel avanzado + macros"],
    razon: "Diferencia abismal en analítica, marketing y operaciones — el 90% de candidatos no las tiene.",
  },
  {
    area: "Marketing digital",
    herramientas: ["Google Analytics 4", "Meta Ads", "HubSpot", "Mailchimp", "Canva"],
    razon: "Certificaciones gratuitas con examen oficial — credenciales reales que aparecen en LinkedIn.",
  },
  {
    area: "Análisis de datos",
    herramientas: ["Excel pivot tables", "Power BI básico", "Tableau Public", "Google Looker Studio"],
    razon: "Demuestran pensamiento cuantitativo, valorado en todos los sectores.",
  },
]
