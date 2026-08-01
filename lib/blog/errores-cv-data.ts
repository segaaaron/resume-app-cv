// 15 errores más costosos en CV, ranking por impacto, para el post ES
// `errores-comunes-cv`. Cada entrada combina el error con una solución concreta
// y un ejemplo antes/después o nota de impacto. Adaptado al mercado
// LATAM/España (convenciones de foto, formato y vocabulario).

export type ErrorCV = {
  rank: number
  title: string
  impact: "Crítico" | "Alto" | "Medio"
  why: string
  fix: string
  example?: { antes: string; despues: string }
}

export const ERRORES_CV: ErrorCV[] = [
  {
    rank: 1,
    title: "Errores ortográficos y gramaticales",
    impact: "Crítico",
    why: "Un error tipográfico en las primeras 50 palabras es el rompedor de trato más común. Los reclutadores lo interpretan como prueba de que no revisas tu propio trabajo — una señal de alarma directa para cualquier rol.",
    fix: "Lee el CV en voz alta, pásalo por LanguageTool o Grammarly, y haz que una persona más lo revise antes de enviar. Nombres de empresas y herramientas son los sitios más comunes de error.",
  },
  {
    rank: 2,
    title: "CV genérico sin personalizar para la oferta",
    impact: "Alto",
    why: "Un CV genérico obliga al recruiter a deducir si encajas. Con una vacante recibiendo miles de candidaturas y la mayoría revisadas por orden de llegada, ese trabajo no se hace — pasan al siguiente CV que ya lo demuestra.",
    fix: "Dedica 10 minutos por postulación a actualizar el resumen, las top 5 habilidades y los keywords de los bullets para coincidir con el vocabulario de la oferta.",
  },
  {
    rank: 3,
    title: "Formato de archivo incorrecto o PDF corrupto",
    impact: "Crítico",
    why: "Los ATS esperan PDFs con texto extraíble. PDFs escaneados, exportados como imagen o archivos .pages fallan en parsing y producen campos vacíos en el dashboard del reclutador.",
    fix: "Exporta como PDF desde un editor basado en texto (Word, Google Docs, Valhalla Resume). Verifica abriendo el PDF y seleccionando el texto — si no puedes, el ATS tampoco podrá.",
  },
  {
    rank: 4,
    title: "Email no profesional",
    impact: "Alto",
    why: "rockerito_89@hotmail.com transmite falta de seriedad en menos de un segundo. Algunos reclutadores admiten abiertamente descartar CVs por el email solo, especialmente en roles senior.",
    fix: "Usa nombre.apellido@gmail.com o un formato profesional similar. Dedica los dos minutos a crear uno.",
  },
  {
    rank: 5,
    title: "Faltan palabras clave de la oferta",
    impact: "Alto",
    why: "Un recruiter que revisa cientos de candidaturas busca las palabras que usó la oferta. Si tu CV describe el mismo trabajo con otros términos, la conexión la tiene que hacer él — y con 2.000 candidaturas para una vacante, no la va a hacer por ti.",
    fix: "Extrae los sustantivos y verbos más recurrentes de la oferta. Inclúyelos textualmente en tu resumen y en al menos un bullet cada uno.",
    example: {
      antes: "Trabajé ampliamente con servicios cloud y frameworks web modernos.",
      despues: "Construí microservicios en AWS con TypeScript y Next.js, desplegando vía CI/CD a producción.",
    },
  },
  {
    rank: 6,
    title: "Listar funciones en lugar de logros",
    impact: "Alto",
    why: "Un bullet que describe lo que el puesto requería se lee como una oferta de empleo. Un bullet que describe lo que conseguiste se lee como un candidato. Los reclutadores entrevistan candidatos, no ofertas.",
    fix: "Reformula cada bullet alrededor del resultado. Usa la fórmula: verbo + acción + resultado cuantificado.",
    example: {
      antes: "Encargada de gestionar campañas de marketing en varios canales.",
      despues: "Ejecuté 14 campañas multicanal generando USD 1.2M en pipeline atribuido con un ROAS de 4.2x.",
    },
  },
  {
    rank: 7,
    title: "Lenguaje vago (&apos;encargado de&apos;, &apos;responsable de&apos;, &apos;ayudé con&apos;)",
    impact: "Medio",
    why: "Los verbos vagos dejan al lector con dudas sobre si lideraste el trabajo o solo lo presenciaste. En un pool competitivo, la duda se convierte en eliminación.",
    fix: "Reemplaza con verbos específicos. Revisa la guía de verbos de acción con 300+ alternativas organizadas por categoría.",
  },
  {
    rank: 8,
    title: "Formato inconsistente",
    impact: "Medio",
    why: "Estilos de viñeta mezclados, formatos de fecha inconsistentes (2023 vs Mar 2023), tamaños de fuente cambiantes — todo indica armado apurado. Los reclutadores lo toman como proxy de calidad del trabajo que harías para ellos.",
    fix: "Fija un estilo de viñeta, un formato de fecha, una tipografía, dos tamaños (cuerpo + título). Aplica una vez y audita visualmente.",
  },
  {
    rank: 9,
    title: "&apos;Objetivo profesional&apos; obsoleto",
    impact: "Medio",
    why: "La frase de objetivo (&quot;Busco una oportunidad para desarrollar mis habilidades...&quot;) quedó retirada hacia 2018. Hoy lee como relleno y empuja real estate valioso hacia abajo en la página.",
    fix: "Reemplaza con un resumen profesional — 3-4 líneas indicando tu rol, años de experiencia y tus 2 diferenciadores principales.",
  },
  {
    rank: 10,
    title: "Longitud incorrecta para tu nivel",
    impact: "Medio",
    why: "Forzar 15 años de experiencia a 1 página lee como inseguro; rellenar 2 años a 2 páginas lee como inflado. La longitud comunica autoconciencia.",
    fix: "0-7 años de experiencia: 1 página. 7+ años: 2 páginas. En Europa (UK, Alemania, España), 2 páginas es el default incluso para perfiles intermedios.",
  },
  {
    rank: 11,
    title: "Foto cuando no corresponde (o falta cuando sí)",
    impact: "Alto",
    why: "Las convenciones de foto son fuertemente regionales. En España, México y la mayor parte de LATAM la foto se espera; en USA, Reino Unido y Canadá, la foto puede activar reglas de rechazo por imagen en el ATS.",
    fix: "España, Alemania, LATAM: foto profesional esperada. USA, Reino Unido, Canadá, Australia: sin foto. Adapta al país del empleador, no al tuyo.",
  },
  {
    rank: 12,
    title: "Incluir referencias en el CV",
    impact: "Medio",
    why: "&quot;Referencias disponibles a solicitud&quot; desperdicia una línea. Listar referentes directamente desperdicia más y expone su contacto a todo pipeline al que postules.",
    fix: "Omite por completo. Entrega una hoja separada de referencias cuando el empleador la pida en etapa de oferta.",
  },
  {
    rank: 13,
    title: "Listar experiencia irrelevante",
    impact: "Medio",
    why: "Un bullet de 5 líneas sobre tu trabajo de mesero hace 8 años desplaza trabajo relevante actual. El reclutador nota qué está ocupando el espacio.",
    fix: "Roles de más de 10 años se colapsan a una sola línea de &quot;Experiencia previa.&quot; Trabajos adyacentes irrelevantes ocupan una línea — cargo, empresa, fechas — sin bullets.",
  },
  {
    rank: 14,
    title: "Plantilla creativa para rol tradicional",
    impact: "Alto",
    why: "Las plantillas multi-columna con muchos gráficos suelen fallar en parsing ATS. También comunican mismatch de marca cuando se aplican a roles de derecho, finanzas, salud o gobierno.",
    fix: "Elige una plantilla de columna única ATS-verificada. Reserva el formato creativo para portfolios de diseño y marketing — y aun ahí, adjunta una versión parser-clean como backup.",
  },
  {
    rank: 15,
    title: "Mentir o exagerar credenciales",
    impact: "Crítico",
    why: "Los background checks ahora se extienden a verificación de títulos, fechas de empleo y crecientemente a logros específicos reclamados. Una discrepancia descubierta a media selección invalida la oferta y muchas veces te bloquea internamente para futuras vacantes.",
    fix: "Siempre reformula en vez de fabricar. Existe una versión verdadera y fuerte de cada hecho débil — encuéntrala, no la inventes.",
  },
]

export const CHECKLIST_AUTOAUDITORIA: string[] = [
  "Sin errores tipográficos en nombre, email, empresas o herramientas",
  "El texto del PDF es seleccionable al abrirlo (no es imagen escaneada)",
  "Nombre de archivo: NombreApellido_CV.pdf",
  "Email profesional formato nombre.apellido@gmail.com",
  "Top 5-10 keywords de la oferta aparecen al menos una vez cada uno",
  "Cada bullet inicia con verbo de acción en el tiempo correcto",
  "Cada bullet tiene al menos una métrica cuantificada (número, %, USD, tiempo)",
  "Ningún verbo aparece más de dos veces en todo el CV",
  "Longitud adecuada: 1 página (0-7 años) o 2 páginas (7+ años)",
  "Foto presente/ausente según convención del país del empleador",
  "Encabezado repetido en página 2 con nombre + contacto",
  "Revisión visual final: tipografías, fechas, viñetas e indentación consistentes",
]
