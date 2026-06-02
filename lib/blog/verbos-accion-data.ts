// 300+ verbos de acción organizados por categoría para el post ES
// `verbos-de-accion-cv`. Verbos en primera persona del pasado (yo lideré, yo
// dirigí) — el formato profesional estándar en CVs hispanohablantes. Se evitan
// verbos sobreusados como "trabajé" o "fui responsable de".

export type VerbCategoryEs = {
  id: string
  title: string
  description: string
  verbs: string[]
}

export const VERBOS_ACCION_CATEGORIAS: VerbCategoryEs[] = [
  {
    id: "liderazgo",
    title: "Liderazgo y gestión",
    description: "Úsalos cuando lideraste personas, proyectos o iniciativas estratégicas. Evita 'gestioné' como verbo por defecto — elige uno que comunique alcance real.",
    verbs: [
      "Dirigí", "Lideré", "Supervisé", "Impulsé", "Encabecé",
      "Orquesté", "Coordiné", "Capitaneé", "Conduje", "Guié",
      "Mentoricé", "Formé", "Capacité", "Empoderé", "Inspiré",
      "Delegué", "Presidí", "Convoqué", "Alineé", "Unifiqué",
      "Consolidé", "Establecí", "Instauré", "Fundé", "Inauguré",
      "Lancé", "Pioneé", "Inicié", "Originé", "Generé",
      "Catalicé", "Propulsé", "Avancé", "Reestructuré", "Reorganicé",
      "Transformé", "Revitalicé", "Modernicé", "Rediseñé", "Renové",
    ],
  },
  {
    id: "comunicacion",
    title: "Comunicación y colaboración",
    description: "Úsalos para presentaciones, trabajo interárea, gestión de stakeholders o cualquier impacto verbal/escrito.",
    verbs: [
      "Comuniqué", "Presenté", "Expuse", "Articulé", "Transmití",
      "Redacté", "Edité", "Documenté", "Elaboré", "Compuse",
      "Negocié", "Medié", "Facilité", "Resolví", "Concilié",
      "Coordiné", "Colaboré", "Sincronicé", "Vinculé", "Conecté",
      "Persuadí", "Influí", "Argumenté", "Defendí", "Sostuve",
      "Traduje", "Interpreté", "Sintetizé", "Clarifiqué", "Resumí",
      "Fomenté", "Cultivé", "Fortalecí", "Estreché", "Consolidé",
    ],
  },
  {
    id: "resultados",
    title: "Logros y resultados",
    description: "Úsalos cuando puedas adjuntar una métrica. Los bullets más fuertes combinan verbo de resultado con número concreto — no los uses sin cifra.",
    verbs: [
      "Logré", "Alcancé", "Superé", "Excedí", "Sobrepasé",
      "Generé", "Produje", "Obtuve", "Conseguí", "Reporté",
      "Dupliqué", "Tripliqué", "Multipliqué", "Cuadrupliqué", "Aumenté",
      "Incrementé", "Crecí", "Expandí", "Escalé", "Amplifiqué",
      "Maximicé", "Optimicé", "Mejoré", "Eleva", "Potencié",
      "Reduje", "Recorté", "Disminuí", "Minimicé", "Acoté",
      "Ahorré", "Recuperé", "Rescaté", "Reactivé", "Recapté",
      "Capté", "Aseguré", "Conquisté", "Gané", "Cerré",
      "Aceleré", "Agilizé", "Apresuré", "Streamlineé", "Acorté",
    ],
  },
  {
    id: "analisis",
    title: "Análisis e investigación",
    description: "Úsalos para trabajo con datos, investigación, auditoría o tareas investigativas. Acompaña con metodología o dataset para credibilidad.",
    verbs: [
      "Analicé", "Investigué", "Examiné", "Estudié", "Exploré",
      "Evalué", "Audité", "Diagnostiqué", "Comparé", "Medí",
      "Cuantifiqué", "Modelé", "Proyecté", "Pronostiqué", "Calculé",
      "Identifiqué", "Detecté", "Descubrí", "Hallé", "Localicé",
      "Interpreté", "Decodifiqué", "Mapeé", "Trazé", "Monitorée",
      "Validé", "Verifiqué", "Probé", "Conciliée", "Sinteticé",
    ],
  },
  {
    id: "innovacion",
    title: "Creatividad e innovación",
    description: "Úsalos cuando diseñaste, inventaste o repensaste algo. Evítalos para mejoras incrementales — esas van en 'Resultados'.",
    verbs: [
      "Diseñé", "Concebí", "Ideé", "Conceptualicé", "Esbocé",
      "Arquitecté", "Creé", "Construí", "Forjé", "Modelé",
      "Inventé", "Innové", "Reinventé", "Reimaginé", "Modernicé",
      "Prototipée", "Formulé", "Compuse", "Trazée", "Bocetée",
      "Curé", "Personalicé", "Adapté", "Customicée", "Configuré",
      "Reposicioné", "Reformulé", "Redefiní", "Remodelée", "Refiné",
    ],
  },
  {
    id: "tecnico",
    title: "Técnico e ingeniería",
    description: "Úsalos para código, infraestructura o trabajo de hardware. La especificidad importa más que la intensidad — nombra el sistema o stack.",
    verbs: [
      "Construí", "Programé", "Desarrollé", "Implementé", "Integré",
      "Desplegué", "Migré", "Refactoricé", "Automaticé", "Optimicé",
      "Configuré", "Aprovisioné", "Orquesté", "Arquitecté", "Escalé",
      "Aseguré", "Encripté", "Hardenicé", "Endurecí", "Blindée",
      "Depuré", "Probé", "Validé", "Parché", "Mantuve",
      "Monitoreé", "Instrumenté", "Perfilé", "Ajusté", "Calibré",
      "Operé", "Administré", "Actualicé", "Versioné", "Desinstalé",
    ],
  },
  {
    id: "ventas",
    title: "Ventas y atención al cliente",
    description: "Úsalos para trabajo en ingresos, pipeline, cuentas o customer success. Acompaña con tamaño de deal, tasa de retención o valor de pipeline.",
    verbs: [
      "Cerré", "Vendí", "Pitché", "Prospecté", "Califiqué",
      "Generé", "Sourceé", "Cultivé", "Nutrí", "Convertí",
      "Retuve", "Renové", "Crucé", "Expandí", "Upgradeé",
      "Onboardée", "Activé", "Reactivé", "Recuperé", "Reenganché",
      "Negocié", "Concreté", "Aseguré", "Cobré", "Capté",
      "Asesoré", "Consulté", "Recomendé", "Resolví", "Atendí",
    ],
  },
  {
    id: "proyectos",
    title: "Gestión de proyectos",
    description: "Úsalos para entrega, alcance y gestión de stakeholders. Acompaña con presupuesto, timeline o tamaño de equipo.",
    verbs: [
      "Entregué", "Ejecuté", "Lancé", "Implementé", "Desplegué",
      "Planifiqué", "Programé", "Secuencié", "Prioricé", "Estructuré",
      "Coordiné", "Alineé", "Orquesté", "Sincronicé", "Articulé",
      "Monitorée", "Reporté", "Escalée", "Trackeé", "Controlé",
      "Mitigué", "Estabilicé", "Rescaté", "Recuperé", "Salvé",
      "Presupuesté", "Asigné", "Reasigné", "Optimicé", "Reconcilié",
    ],
  },
  {
    id: "educacion",
    title: "Educación y capacitación",
    description: "Úsalos para diseño instruccional, formación, mentoría o transferencia de conocimiento.",
    verbs: [
      "Capacité", "Enseñé", "Formé", "Instruí", "Eduqué",
      "Mentoricé", "Coaching", "Facilité", "Guié", "Acompañé",
      "Onboardée", "Tutoreé", "Demostré", "Modelée", "Ilustré",
      "Expliqué", "Aclaré", "Diseñé", "Curé", "Elaboré",
      "Evalué", "Examiné", "Certifiqué", "Acredité", "Gradué",
    ],
  },
]

// Verbos sobreusados (y sus reemplazos fuertes)
export const VERBOS_SOBREUSADOS: { debil: string; fuertes: string[] }[] = [
  { debil: "Trabajé en", fuertes: ["Construí", "Desarrollé", "Entregué", "Implementé"] },
  { debil: "Fui responsable de", fuertes: ["Lideré", "Dirigí", "Encabecé", "Coordiné"] },
  { debil: "Encargado de", fuertes: ["Lideré", "Gestioné", "Supervisé", "Coordiné"] },
  { debil: "Ayudé con", fuertes: ["Colaboré", "Aporté", "Contribuí", "Apoyé"] },
  { debil: "Hice", fuertes: ["Ejecuté", "Entregué", "Completé", "Realicé"] },
  { debil: "Usé", fuertes: ["Apliqué", "Aproveché", "Implementé", "Operé"] },
  { debil: "Mejoré", fuertes: ["Optimicé", "Potencié", "Elevé", "Refinée"] },
  { debil: "Participé en", fuertes: ["Lideré", "Coordiné", "Aporté a", "Colaboré con"] },
]

// Ejemplos antes/después en español
export const EJEMPLOS_ANTES_DESPUES: { antes: string; despues: string; verbo: string }[] = [
  {
    antes: "Encargada de gestionar el equipo de redes sociales.",
    despues: "Dirigí un equipo de 4 personas en redes sociales, llevando la audiencia de 12K a 48K en 9 meses.",
    verbo: "Dirigí",
  },
  {
    antes: "Ayudé con el nuevo proceso de onboarding.",
    despues: "Diseñé el flujo de onboarding que redujo el time-to-first-value de 14 a 4 días.",
    verbo: "Diseñé",
  },
  {
    antes: "Trabajé en un proyecto para reducir costos.",
    despues: "Lideré una iniciativa de reducción de costos en 3 áreas, generando ahorros de USD 480K anuales.",
    verbo: "Lideré",
  },
  {
    antes: "Hice capacitaciones a empleados nuevos.",
    despues: "Diseñé e impartí el programa de onboarding para 60+ nuevos ingresos en 4 cohortes.",
    verbo: "Diseñé e impartí",
  },
  {
    antes: "Usé Tableau para hacer reportes.",
    despues: "Construí 12 dashboards ejecutivos en Tableau adoptados por la dirección para revisiones semanales.",
    verbo: "Construí",
  },
]

export const TOTAL_VERBOS_COUNT = VERBOS_ACCION_CATEGORIAS.reduce(
  (sum, cat) => sum + cat.verbs.length,
  0,
)
