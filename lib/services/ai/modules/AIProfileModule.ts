// lib/services/ai/modules/AIProfileModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL,
  AI_MODEL_PROSE,
  AI_TEMPERATURE,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { aiTellWords } from "../shared/cv-writing-doctrine"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, buildSectionContext, resolveLanguage, hasHardCodedFact, isGroundedIn } from "../shared/ai-helpers"
import { computeCostUsd, costOfChat } from "../shared/cost-tracker"
import { canonicalSkillName } from "@/lib/ats/skill-catalog"
import { buildModePrompt } from "./profile-modes"
import { assessDescription } from "../shared/bullet-quality"
import { cleanGeneratedText } from "../shared/clean-output"
import {
  AI_INPUT_LIMITS,
  FillProfileResponseSchema,
  type FillProfileInput,
  type FillProfileResult,
} from "../shared/ai-types"

/** Longest a skill may be. See `isSkillName` for where the number comes from. */
const MAX_SKILL_WORDS = 4

export class AIProfileModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async fillProfile(userId: string, input: FillProfileInput, plan: string): Promise<FillProfileResult> {
    await enforceAIQuota(userId, "fill-profile", plan)

    const { prompt, sectionData, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const validation = validateAIInput(prompt, AI_INPUT_LIMITS.prompt)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    // The three short paths. Each one is a different task with its own prompt,
    // measured; see profile-modes.ts for the numbers and why they exist. They
    // run before any of the extraction machinery below, which needs a résumé
    // they do not have and do not want.
    if (input.mode) {
      return await this.runMode(userId, input.mode, prompt, language, plan, sectionData, { terms: input.postingTerms, title: input.postingTitle })
    }

    const sd = sectionData ?? {}
    const resumeContext = buildResumeContext(sd, language)
    const fillCtxValidation = validateAIInput(resumeContext, AI_INPUT_LIMITS.resumeContext)
    if (!fillCtxValidation.valid) throw new AppError("invalid_input", 400)

    const existingSkills = ((sd.skills ?? []) as { name: string }[]).map((s) => s.name).join(", ")

    const workExpItems = (sd.workExperience ?? []) as { employer?: string; jobTitle?: string }[]
    const personalDet = (sd.personalDetails ?? {}) as { location?: string; jobTitle?: string }
    const skillBlocklist = new Set(
      [
        ...workExpItems.flatMap((j) => [j.employer, j.jobTitle]),
        personalDet.location,
        personalDet.jobTitle,
      ]
        .filter((v): v is string => Boolean(v))
        .map((v) => v.toLowerCase().trim())
    )
    const existingLanguages = ((sd.languages ?? []) as { name: string }[]).map((l) => l.name).join(", ")

    // Only work experience stores bullets; the other three sections are prose.
    const workExpCtx = buildSectionContext(language === "en" ? "WORK EXPERIENCE" : "EXPERIENCIA LABORAL", (sd.workExperience ?? []) as Parameters<typeof buildSectionContext>[1], { bullets: true })
    const educationCtx = buildSectionContext(language === "en" ? "EDUCATION" : "EDUCACIÓN", (sd.education ?? []) as Parameters<typeof buildSectionContext>[1])
    const projectsCtx = buildSectionContext(language === "en" ? "PROJECTS" : "PROYECTOS", (sd.projects ?? []) as Parameters<typeof buildSectionContext>[1])
    const volunteerCtx = buildSectionContext(language === "en" ? "VOLUNTEER" : "VOLUNTARIADO", (sd.volunteer ?? []) as Parameters<typeof buildSectionContext>[1])

    const sectionsWithIds = [workExpCtx, educationCtx, projectsCtx, volunteerCtx].filter(Boolean).join("\n")

    const userPrompt = language === "en"
      ? `GROUNDING RULES (mandatory, no exceptions):
1. ONLY produce content derivable from the candidate's instruction and the CURRENT RESUME above. Do NOT state technologies, frameworks, libraries, company names, job titles, certifications, dates, percentages, or real numbers not provided.
2. NEVER use placeholders like [X%] or [N users] in final output — if the user didn't provide a metric, omit it.
3. For workExperienceNew: every entry must come from a job or a PROFESSION the candidate states. If they name only a profession ("I am a telecommunications engineer with 5 years"), still create ONE entry: jobTitle = that profession, employer = "", dates = "", and a description of 4-5 bullets of the work that role normally does — that draft is the point, and they review it before it reaches the resume. If they describe a job but never name the company, leave employer as "" — NEVER hard-code a company name. Omit the whole entry only when neither the company nor the role comes from the instruction.
4. For suggestedSkills: only skills explicitly mentioned in the instruction or the current resume.
5. inferredSkills is the ONE field where you may go beyond what the candidate wrote: list skills their role normally carries and that they most likely have. Keep them plausible for THIS role and seniority — never a tool from another trade, never a certification, never anything that implies a fact about them (an employer, a degree, a licence). The candidate reviews these one by one before any of them reaches the resume.

The candidate wants to improve their resume with this instruction:
"${prompt.trim()}"

=== CURRENT RESUME ===
${resumeContext}
${sectionsWithIds}

${existingSkills ? `Current skills (DO NOT repeat): ${existingSkills}` : ""}
${existingLanguages ? `Current languages (DO NOT repeat): ${existingLanguages}` : ""}
${(sd as { hobbies?: string }).hobbies ? `Current interests: ${(sd as { hobbies?: string }).hobbies}` : ""}

TASK: Analyze the instruction and determine which resume sections need improvement. Apply changes where appropriate:

- If mentions a company or role that already exists in the resume → improve that entry's description using its exact id in workExperienceUpdates
- If mentions a company or role NOT in the current resume → create it in workExperienceNew with jobTitle, employer, city, startDate, endDate, currentlyWorking and description (• bullet points, no markdown). Leave empty "" any of those fields the candidate did not state. Max 3 new entries.
- If the resume has NO work experience at all and the candidate stated a profession, workExperienceNew is NOT optional: return exactly one entry with jobTitle = that profession, employer = "", dates = "", and 4-5 bullets of what that role does. An empty experience section is the single biggest reason a resume is rejected, and the candidate edits this draft rather than facing a blank page.
- If talks about their general profile → improve the summary and/or jobTitle
- If mentions skills → add to suggestedSkills (ONLY real technical or soft skills: frameworks, languages, tools, methodologies; NEVER company names, employers, job titles, cities or locations)
- EVERY skill, in both skill lists, is the CANONICAL NAME of a tool, technology, standard or methodology — 1 to 3 words, the way it appears in a job posting so an ATS matches it exactly. Never a description of an activity.
  RIGHT: "React", "PostgreSQL", "Git", "REST APIs", "Docker", "Scrum", "Excel", "SAP", "AutoCAD", "Basel III"
  WRONG: "Designing and maintaining relational databases" → write "PostgreSQL" or "SQL". "Version control with Git" → write "Git". "Consuming REST APIs" → write "REST APIs". "Responsive layout" → write "CSS" or "Responsive Design".
- ALWAYS fill inferredSkills, whatever the trade: 4 to 6 skills standard for this role that the candidate did NOT name.
- ALWAYS fill suggestedCertifications: 3 to 6 credentials STANDARD for this role, whatever the trade — CCNA or CCNP for a network engineer, ITIL for support, food-handling for a cook, a teaching licence for a teacher, a forklift licence for a warehouse lead. Name real, recognisable credentials; never say the candidate holds one.
- If they mention studying somewhere → put it in educationNew with degree and institution, leaving empty "" anything they did not state A branch manager gets cash handling and team supervision; a legal secretary gets case-file management and court deadlines; a cook gets food safety and portion control. Never repeat one already in suggestedSkills or in the resume.
- If mentions languages → add to suggestedLanguages with appropriate level
- If mentions education → improve that education entry's description
- If mentions projects → improve that project's description
- If mentions volunteer work → improve that entry's description
- If mentions interests or hobbies → update the hobbies field
- Can apply to multiple sections simultaneously

Respond ONLY with valid JSON (no markdown). Only include fields that actually change, omit the rest:
{
  "summary": "<improved summary or null>",
  "jobTitle": "<updated title or null>",
  "hobbies": "<updated interests or null>",
  "suggestedSkills": ["<skill the candidate named>"],
  "inferredSkills": ["<skill standard for the role, not named by the candidate>"],
  "suggestedCertifications": ["<credential standard for the role>"],
  "educationNew": [{ "degree": "<degree>", "institution": "<school>", "fieldOfStudy": "<optional>", "startDate": "<MM/YYYY optional>", "endDate": "<MM/YYYY optional>" }],
  "suggestedLanguages": [{ "name": "<language>", "level": "a1|a2|b1|b2|c1|c2|native" }],
  "workExperienceUpdates": [{ "id": "<exact id>", "description": "<improved description with • bullets, no markdown>" }],
  "workExperienceNew": [{ "jobTitle": "<role>", "employer": "<company>", "city": "<optional city>", "startDate": "<MM/YYYY optional>", "endDate": "<MM/YYYY optional>", "currentlyWorking": false, "description": "<• bullets>" }],
  "educationUpdates": [{ "id": "<exact id>", "description": "<improved description>" }],
  "projectUpdates": [{ "id": "<exact id>", "description": "<improved description with • bullets>" }],
  "volunteerUpdates": [{ "id": "<exact id>", "description": "<improved description>" }]
}

Rules:
- ALWAYS use the exact ids from the section listing above. Use only the ids listed; never make one up.
- Improved descriptions integrate what the candidate said + what already existed, cohesively and professionally.
- Do not hard-code data (dates, companies, metrics) the candidate didn't mention.
- Human voice (avoid AI-detection): write summaries/descriptions with varied sentence length and a natural tone, not a press release. Avoid AI-tell words: ${aiTellWords("en")}.

ATS-FRIENDLY WRITING (the content must pass an ATS scan AND a recruiter's 7-second read):
- Every bullet OPENS with a strong action verb (Built, Led, Reduced, Increased, Designed, Launched, Delivered, Automated, Migrated, Improved, Cut, Grew). NEVER open with a duty phrase ("Responsible for", "Helped with", "Worked on", "Involved in") or a pronoun.
- Bullet shape: action → what you did → result. Include a metric ONLY if the candidate gave one; if they gave none, write a strong action-and-outcome bullet WITHOUT a number — a figure you pick is yours, not theirs.
- Use the STANDARD, canonical spelling of technologies/tools/skills so an ATS matches them exactly ("React Native", "REST APIs", "PostgreSQL", "CI/CD", "Node.js") — never abbreviate, misspell or paraphrase a known tool's name.
- Dates in MM/YYYY whenever the candidate provides one (ATS parse employment dates to compute tenure).
- Plain "• " bullets only — no tables, columns, emojis or special characters.
- Weave the candidate's real skills/keywords naturally into summary and bullets (not only the skills list), since ATS reward a keyword that appears in context.`
      : `REGLAS DE ANCLAJE (obligatorias, sin excepciones):
1. SOLO produce contenido derivable de la instrucción del candidato y del CV ACTUAL de arriba. NO quemes tecnologías, frameworks, librerías, nombres de empresas, cargos, certificaciones, fechas, porcentajes ni números reales no proporcionados.
2. NUNCA uses placeholders como [X%] o [N usuarios] en el output final — si el usuario no proporcionó una métrica, omítela.
3. Para workExperienceNew: cada entrada debe provenir de un trabajo o de una PROFESIÓN que el candidato declara. Si solo nombra una profesión ("soy ingeniero de telecomunicaciones con 5 años"), crea igual UNA entrada: jobTitle = esa profesión, employer = "", fechas = "", y una description de 4-5 viñetas del trabajo que ese puesto normalmente hace — ese borrador es justamente el objetivo, y el candidato lo revisa antes de que llegue al CV. Si describe un trabajo pero nunca nombra la empresa, deja employer como "" — NUNCA quemes un nombre de empresa. Omite la entrada completa solo cuando ni la empresa ni el puesto provienen de la instrucción.
4. Para suggestedSkills: solo habilidades mencionadas explícitamente en la instrucción o en el CV actual.
5. inferredSkills es el ÚNICO campo donde puedes ir más allá de lo que el candidato escribió: lista habilidades que su puesto normalmente lleva y que con toda probabilidad tiene. Mantenlas plausibles para ESTE puesto y ESTA antigüedad — nunca una herramienta de otro oficio, nunca una certificación, nunca nada que afirme un hecho sobre él (un empleador, un título, una licencia). El candidato las revisa una por una antes de que ninguna llegue al CV.

El candidato quiere mejorar su CV con esta instrucción:
"${prompt.trim()}"

=== CV ACTUAL ===
${resumeContext}
${sectionsWithIds}

${existingSkills ? `Habilidades actuales (NO repetir): ${existingSkills}` : ""}
${existingLanguages ? `Idiomas actuales (NO repetir): ${existingLanguages}` : ""}
${(sd as { hobbies?: string }).hobbies ? `Intereses actuales: ${(sd as { hobbies?: string }).hobbies}` : ""}

TAREA: Analiza la instrucción y determina qué secciones del CV deben mejorar. Aplica los cambios donde corresponda:

- Si menciona una empresa o rol que ya existe en el CV → mejora la descripción de esa entrada usando su id exacto en workExperienceUpdates
- Si menciona una empresa o rol que NO existe en el CV actual → créala en workExperienceNew con jobTitle, employer, city, startDate, endDate, currentlyWorking y description (viñetas • sin markdown). Deja vacío "" cualquiera de esos campos que el candidato no haya dicho. Máximo 3 entradas nuevas.
- Si el CV NO tiene ninguna experiencia laboral y el candidato declaró una profesión, workExperienceNew NO es opcional: devuelve exactamente una entrada con jobTitle = esa profesión, employer = "", fechas = "", y de 4 a 5 viñetas de lo que hace ese puesto. Una sección de experiencia vacía es el motivo número uno por el que se descarta un CV, y el candidato edita ese borrador en lugar de enfrentarse a una página en blanco.
- Si habla de su perfil general → mejora el resumen (summary) y/o título (jobTitle)
- Si menciona habilidades → agrégalas a suggestedSkills (SOLO habilidades técnicas o blandas reales: frameworks, lenguajes, herramientas, metodologías; NUNCA nombres de empresas, empleadores, puestos de trabajo, ciudades ni ubicaciones)
- TODA habilidad, en las dos listas, es el NOMBRE CANÓNICO de una herramienta, tecnología, estándar o metodología — de 1 a 3 palabras, tal como aparece en una oferta de trabajo para que un ATS la matchee exacto. Nunca la descripción de una actividad.
  BIEN: "React", "PostgreSQL", "Git", "REST APIs", "Docker", "Scrum", "Excel", "SAP", "AutoCAD", "Basilea III"
  MAL: "Diseño y mantenimiento de bases de datos relacionales" → escribí "PostgreSQL" o "SQL". "Control de versiones con Git" → escribí "Git". "Consumo de REST APIs" → escribí "REST APIs". "Maquetación responsiva" → escribí "CSS" o "Diseño responsivo".
- Rellena SIEMPRE inferredSkills, sea cual sea el oficio: de 4 a 6 habilidades estándar de ese puesto que el candidato NO nombró.
- Rellena SIEMPRE suggestedCertifications: de 3 a 6 credenciales ESTÁNDAR de ese puesto, sea cual sea el oficio — CCNA o CCNP para un ingeniero de redes, ITIL para soporte, carnet de manipulación de alimentos para un cocinero, licencia docente para un profesor, licencia de montacargas para un jefe de almacén. Nombra credenciales reales y reconocibles; escríbelas como lo que el puesto suele pedir, nunca como algo que él ya tenga.
- Si menciona que estudió en algún lado → ponlo en educationNew con degree e institution, dejando vacío "" lo que no haya dicho A un gerente de sucursal le corresponden manejo de efectivo y supervisión de equipo; a una secretaria jurídica, gestión de expedientes y control de plazos judiciales; a un cocinero, inocuidad alimentaria y control de porciones. Nunca repitas una que ya esté en suggestedSkills ni en el CV.
- Si menciona idiomas → agrégalos a suggestedLanguages con nivel apropiado
- Si menciona estudios → mejora la descripción de esa educación
- Si menciona proyectos → mejora la descripción de ese proyecto
- Si menciona voluntariado → mejora la descripción de esa entrada
- Si menciona intereses o hobbies → actualiza el campo hobbies
- Puede aplicar a múltiples secciones simultáneamente

Responde ÚNICAMENTE con JSON válido (sin markdown). Solo incluye los campos que realmente cambian, omite los demás:
{
  "summary": "<resumen mejorado o null>",
  "jobTitle": "<título actualizado o null>",
  "hobbies": "<intereses actualizados o null>",
  "suggestedSkills": ["<habilidad que el candidato nombró>"],
  "inferredSkills": ["<habilidad estándar del puesto, no nombrada por el candidato>"],
  "suggestedCertifications": ["<credencial estándar del puesto>"],
  "educationNew": [{ "degree": "<título>", "institution": "<institución>", "fieldOfStudy": "<opcional>", "startDate": "<MM/AAAA opcional>", "endDate": "<MM/AAAA opcional>" }],
  "suggestedLanguages": [{ "name": "<idioma>", "level": "a1|a2|b1|b2|c1|c2|native" }],
  "workExperienceUpdates": [{ "id": "<id exacto>", "description": "<descripción mejorada con viñetas •, sin markdown>" }],
  "workExperienceNew": [{ "jobTitle": "<puesto>", "employer": "<empresa>", "city": "<ciudad opcional>", "startDate": "<MM/YYYY opcional>", "endDate": "<MM/YYYY opcional>", "currentlyWorking": false, "description": "<bullets •>" }],
  "educationUpdates": [{ "id": "<id exacto>", "description": "<descripción mejorada>" }],
  "projectUpdates": [{ "id": "<id exacto>", "description": "<descripción mejorada con viñetas •>" }],
  "volunteerUpdates": [{ "id": "<id exacto>", "description": "<descripción mejorada>" }]
}

Reglas:
- Usa SIEMPRE los ids exactos del listado de secciones de arriba. Usá sólo los ids listados; nunca uses uno que no esté ahí.
- Las descripciones mejoradas integran lo que el candidato dijo + lo que ya existía, de forma cohesiva y profesional.
- Fechas, empresas y métricas salen de lo que el candidato mencionó; cualquier otra sería un dato quemado por ti.
- Voz humana (evita detección de IA): escribe resúmenes/descripciones con frases de largo variado y tono natural, no nota de prensa. Evita palabras-IA: ${aiTellWords("es")}.

ESCRITURA ATS-FRIENDLY (el contenido debe pasar un ATS Y el escaneo de 7 segundos de un reclutador):
- Cada bullet ABRE con un verbo de acción fuerte (Desarrollé, Lideré, Reduje, Aumenté, Diseñé, Lancé, Entregué, Automaticé, Migré, Mejoré, Recorté). NUNCA abras con una frase de tarea ("Responsable de", "Ayudé con", "Trabajé en", "Encargado de") ni con un pronombre.
- Forma del bullet: acción → qué hiciste → resultado. Incluye una métrica SOLO si el candidato la dio; si no la dio, escribe un bullet fuerte de acción-y-resultado SIN número — nunca fabriques una cifra.
- Usa la ortografía ESTÁNDAR y canónica de tecnologías/herramientas/skills para que un ATS las matchee exacto ("React Native", "REST APIs", "PostgreSQL", "CI/CD", "Node.js") — nunca abrevies, escribas mal ni parafrasees el nombre de una herramienta conocida.
- Fechas en MM/YYYY siempre que el candidato dé una (el ATS calcula la antigüedad desde las fechas).
- Solo viñetas "• " simples — sin tablas, columnas, emojis ni caracteres especiales.
- Teje los skills/keywords reales del candidato de forma natural en el resumen y los bullets (no solo en la lista de skills), porque el ATS premia una keyword que aparece en contexto.`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 2000,
      // fill-profile uses 0.4 — needs some creativity to map natural-language
      // instructions to structured fields, but stays faithful to user input.
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            (language === "en"
              ? "You are an expert professional résumé writer. Your job is to take the candidate's instructions and turn them into concrete professional content for each section of their résumé. " +
                "You respect and expand on what the candidate states — you never hard-code information not derived from their description. " +
                "You ONLY process instructions related to a real professional profile. " +
                "If the text is unrelated to professional matters, respond with: {} and nothing else. "
              : "Eres un redactor experto en CVs profesionales. Tu trabajo es tomar instrucciones del candidato y traducirlas en contenido profesional concreto para cada sección de su CV. " +
                "Respetas y amplías lo que el candidato menciona — nunca quemás información no derivada de su descripción. " +
                "SOLO procesas instrucciones relacionadas con perfil laboral real. " +
                "Si el texto no tiene relación profesional, responde con: {} sin texto adicional. ") +
            langInstruction,
        },
        { role: "user", content: userPrompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<FillProfileResult>(raw)

    const hasContent = parsed.summary || parsed.jobTitle || parsed.hobbies ||
      parsed.suggestedSkills?.length || parsed.inferredSkills?.length ||
      parsed.suggestedCertifications?.length || parsed.educationNew?.length || parsed.suggestedLanguages?.length ||
      parsed.workExperienceUpdates?.length || parsed.workExperienceNew?.length ||
      parsed.educationUpdates?.length || parsed.projectUpdates?.length || parsed.volunteerUpdates?.length

    if (!hasContent) {
      throw new AppError("off_topic", 422)
    }

    const validated = FillProfileResponseSchema.safeParse(parsed)
    const data = validated.success ? validated.data : parsed

    const validWorkIds = new Set(((sd.workExperience ?? []) as { id: string }[]).map((j) => j.id))
    const validEduIds = new Set(((sd.education ?? []) as { id: string }[]).map((e) => e.id))
    const validProjIds = new Set(((sd.projects ?? []) as { id: string }[]).map((p) => p.id))
    const validVolIds = new Set(((sd.volunteer ?? []) as { id: string }[]).map((v) => v.id))

    // Anti-hard-coded fact grounding source = user instruction + current resume.
    const groundingSource = `${prompt}\n${resumeContext}`.toLowerCase()

    /**
     * A skill is a NAME, not a sentence.
     *
     * The model was returning "Diseño y mantenimiento de bases de datos
     * relacionales" where a résumé needs "PostgreSQL": an ATS matches keywords,
     * and a description of an activity matches nothing. The ceiling is read off
     * our own curated dictionary rather tha hard-coded — of its 1,002 entries,
     * 94% are one or two words and none exceeds four, and the four-word ones are
     * a name plus its acronym ("Applicant Tracking Systems (ATS)").
     *
     * The prompt asks for canonical names; this is what happens when it does not
     * get them.
     */
    const isSkillName = (s: string) => s.trim().split(/\s+/).length <= MAX_SKILL_WORDS

    /**
     * Our catalog's spelling when it knows the skill, the model's when it does
     * not.
     *
     * 1,002 curated terms are a taxonomy, and aligning to it is what an ATS does
     * to the résumé anyway — but they do not cover every trade, so an unknown
     * skill is kept rather than dropped. Dropping it would repeat the filter that
     * once left the suggestion list able to echo only what the user had typed.
     */
    const canonical = (s: string) => canonicalSkillName(s) ?? s.trim()

    // suggestedSkills: keep only those mentioned in prompt or sectionData.
    let droppedSkills = 0
    const cleanSkills = (data.suggestedSkills ?? [])
      .filter(isSkillName)
      .filter((s: string) => !skillBlocklist.has(s.toLowerCase().trim()))
      .filter((s: string) => {
        const sl = s.toLowerCase().trim()
        if (!sl) return false
        if (groundingSource.includes(sl)) return true
        droppedSkills++
        return false
      })
      .map(canonical)
      .slice(0, 8)

    // inferredSkills is the one list the grounding filter must NOT touch: the
    // whole point is proposing what the candidate did not write. What still
    // applies is everything that stops a PROPOSAL turning into a CLAIM —
    // no employers, cities or job titles dressed up as skills, nothing already
    // in the resume, and nothing duplicating what they did write. They arrive
    // unchecked in the panel, so the user is the filter.
    const alreadyHave = new Set([
      ...cleanSkills.map((s: string) => s.toLowerCase().trim()),
      ...((sd.skills ?? []) as { name: string }[]).map((s) => (s.name ?? "").toLowerCase().trim()),
    ])
    const cleanInferred = (data.inferredSkills ?? [])
      .map((s: string) => s.trim())
      .filter(isSkillName)
      .filter((s: string) => {
        const sl = s.toLowerCase()
        if (!sl || sl.length > 60) return false
        if (skillBlocklist.has(sl)) return false
        if (alreadyHave.has(sl)) return false
        alreadyHave.add(sl)
        return true
      })
      .map(canonical)
      .slice(0, 6)

    const promptLower = prompt.toLowerCase()

    // Certifications are EXAMPLES for the role, so grounding them against the
    // user's own words would empty the list — that filter is what made the
    // skills section unable to suggest anything. What still applies is the line
    // between a proposal and a claim: they arrive unticked, and nothing that is
    // really an employer, a city or a job title gets in wearing a badge.
    const cleanCertifications = (data.suggestedCertifications ?? [])
      .map((c: string) => c.trim())
      .filter((c: string) => {
        const cl = c.toLowerCase()
        return cl.length > 1 && cl.length <= 80 && !skillBlocklist.has(cl)
      })
      .slice(0, 6)

    // educationNew: same rule as a new job. A degree the user described is
    // theirs; a university they never named is not ours to write down.
    let droppedEducation = 0
    const cleanEducation = (data.educationNew ?? [])
      .map((entry) => {
        const degree = (entry.degree ?? "").trim()
        const institution = (entry.institution ?? "").trim()
        const degreeGrounded = !!degree && isGroundedIn(degree, promptLower)
        const institutionGrounded = !!institution && isGroundedIn(institution, promptLower)
        if (!degreeGrounded && !institutionGrounded) { droppedEducation++; return null }
        return {
          ...entry,
          degree: degreeGrounded ? degree : "",
          institution: institutionGrounded ? institution : "",
        }
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .slice(0, 3)

    // workExperienceNew: drop entries whose employer or jobTitle cannot be
    // grounded in the user's instruction (the resume's existing items are
    // handled via workExperienceUpdates, so new ones must come from the prompt).
    let droppedNewWork = 0
    let blankedFields = 0
    const cleanNewWork = (data.workExperienceNew ?? [])
      .map((entry) => {
        const employer = (entry.employer ?? "").trim()
        const role = (entry.jobTitle ?? "").trim()
        // Grounded, not echoed. Demanding a verbatim substring dropped the model
        // for doing the right thing: "backend dev" in the user's text becomes
        // "Backend Developer" on a CV, and that entry was binned.
        const employerGrounded = !!employer && isGroundedIn(employer, promptLower)
        const roleGrounded = !!role && isGroundedIn(role, promptLower)
        // Requiring BOTH grounded binned the common case: people describe a job
        // ("I cooked for three years in a hotel restaurant") without naming the
        // company. The model has to put SOMETHING in `employer`, that hard-coded fact
        // failed grounding, and the whole entry — description included — was
        // thrown away. The user saw an assistant that returned only a summary.
        // Now the ungrounded FIELD is blanked, not the work the user described;
        // an empty employer is a hole they fill in, never a hard-coded company.
        if (!employerGrounded && !roleGrounded) {
          // Nothing here comes from the user. This one really is hard-coded.
          droppedNewWork++
          return null
        }
        // The description is checked for hard-coded tech and metrics ONLY when the
        // entry is tied to a real employer the user named. There, a tool they
        // never mentioned is a false claim about a real job.
        //
        // An entry with no employer is a DRAFT of the role — "this is what a
        // telecommunications engineer does" — which is exactly what we asked
        // the model for, and it cannot be written without naming the tools of
        // the trade. Checking it would bin every draft for doing its job. It
        // reaches the CV only when the user presses Apply on it.
        if (
          employerGrounded &&
          entry.description &&
          hasHardCodedFact(entry.description, `${prompt}\n${resumeContext}`)
        ) {
          droppedNewWork++
          return null
        }
        if (!employerGrounded || !roleGrounded) blankedFields++
        return {
          ...entry,
          employer: employerGrounded ? employer : "",
          jobTitle: roleGrounded ? role : "",
        }
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .slice(0, 3)

    if (droppedSkills > 0 || droppedNewWork > 0 || blankedFields > 0 || droppedEducation > 0) {
      this.logger.warn("[AIService.fillProfile] dropped hard-coded content", {
        droppedSkills,
        droppedNewWork,
        blankedFields,
        droppedEducation,
      })
    }

    const usage = response.usage
    logAIUsage(userId, "fill-profile", {
      model: AI_MODEL,
      plan,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: costOfChat(AI_MODEL, usage),
    })
    return {
      summary: data.summary ?? null,
      jobTitle: data.jobTitle ?? null,
      hobbies: data.hobbies ?? null,
      suggestedSkills: cleanSkills,
      inferredSkills: cleanInferred,
      suggestedCertifications: cleanCertifications,
      educationNew: cleanEducation,
      suggestedLanguages: (data.suggestedLanguages ?? []).slice(0, 5),
      workExperienceUpdates: (data.workExperienceUpdates ?? []).filter((u: { id: string }) => validWorkIds.has(u.id)),
      workExperienceNew: cleanNewWork,
      educationUpdates: (data.educationUpdates ?? []).filter((u: { id: string }) => validEduIds.has(u.id)),
      projectUpdates: (data.projectUpdates ?? []).filter((u: { id: string }) => validProjIds.has(u.id)),
      volunteerUpdates: (data.volunteerUpdates ?? []).filter((u: { id: string }) => validVolIds.has(u.id)),
    }
  }

  /**
   * One short, task-specific call — with one retry.
   *
   * Even the right prompt is not deterministic: the model still answers `{}`
   * occasionally, and the person on the other side just typed their profession
   * correctly and is being told it did not work. A second attempt costs ~130
   * tokens and turns a 1-in-10 dead end into roughly 1 in 100. Two would be
   * cheaper still than one abandoned CV, but a wall of retries hides a prompt
   * that has genuinely stopped working, so it stops at one.
   */
  private async runMode(
    userId: string,
    mode: NonNullable<FillProfileInput["mode"]>,
    prompt: string,
    language: string,
    plan: string,
    sectionData?: Record<string, unknown>,
    /** La vacante que el usuario está trabajando, cuando ya analizó una. */
    posting?: { terms?: string[]; title?: string },
  ): Promise<FillProfileResult> {
    const { system, user, maxTokens, writesProse } = buildModePrompt(mode, prompt, language, sectionData, {
      // La vacante que el usuario está trabajando, cuando ya analizó una. Falla
      // abierto: sin oferta, el prompt es exactamente el de antes.
      terms: posting?.terms,
      title: posting?.title,
    })
    // The prompt file declares what the task IS; this is the one place that maps
    // that to a model, so the prompt text stays free of the client and its db.
    const model = writesProse ? AI_MODEL_PROSE : AI_MODEL

    let empty = false
    /**
     * What the previous attempt got wrong, appended to the retry.
     *
     * The loop already existed for an empty answer. It now also covers a defect
     * the project's OWN checker can see in what came back: the assistant wrote
     * "Participé en la automatización de QA…" into a real CV, and "participé en"
     * has been on `WEAK_OPENERS` all along — nothing was checking the assistant's
     * output against it. A guard that only runs on the improve buttons is a guard
     * the assistant is exempt from, and the assistant is where most bullets are
     * born now.
     *
     * It REPORTS the defect and quotes the line; it adds no rule the prompt does
     * not already carry.
     */
    let retryNote = ""
    /**
     * ONE row for this endpoint, first attempt plus the retry.
     *
     * Logging inside the loop wrote a second row whenever the assistant was asked
     * again, and the admin panel groups AIUsageLog with `_count: { id: true }` —
     * so one question from the user would have read as two calls while the cost
     * column stayed right. The convention the summary and the cover letter
     * already follow. Billed from a `finally` so the empty-twice throw at the
     * bottom pays for what it spent, same as every successful return.
     */
    const usages: Array<{ prompt_tokens?: number; completion_tokens?: number }> = []
    try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await this.aiClient.chat({
        model,
        max_tokens: maxTokens,
        temperature: AI_TEMPERATURE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: attempt === 0 || !retryNote ? user : `${user}\n\n${retryNote}` },
        ],
      })

      usages.push(response.usage ?? {})

      const parsed = parseAIJson<{
        off_topic?: boolean
        jobTitle?: string
        summary?: string
        summaries?: string[]
        inferredSkills?: string[]
        suggestedCertifications?: string[]
        bullets?: string[]
      }>(response.choices[0]?.message?.content ?? "")

      // The model saying "this names no job" is an answer, not a failure, and
      // it must not be retried — the second call would cost money to be told
      // the same thing.
      if (parsed.off_topic) throw new AppError("off_topic", 422)

      const skills = (parsed.inferredSkills ?? []).filter((s) => s.trim() && s.trim().split(/\s+/).length <= MAX_SKILL_WORDS)
      const certs = (parsed.suggestedCertifications ?? []).filter((c) => c.trim())
      const lines = (parsed.bullets ?? []).filter((b) => b.trim())
      // One summary or three: the prompt asks for three, and a model that
      // returns a single one is still a usable answer, not a failure.
      const summaries = (parsed.summaries ?? []).map((t) => t.trim()).filter(Boolean)
      if (!summaries.length && parsed.summary?.trim()) summaries.push(parsed.summary.trim())

      const gotSomething = mode === "certifications" ? certs.length > 0
        : mode === "bullets" ? lines.length > 0
        : !!(parsed.jobTitle?.trim() || summaries.length || skills.length)

      if (!gotSomething) { empty = true; continue }

      // The assistant's bullets go straight into the CV, so they answer to the
      // same checker as every other bullet in the product.
      let cleanLines = lines
      if (mode === "bullets") {
        const weak = assessDescription(cleanLines.map((b) => `• ${b}`).join("\n"))
          .bullets.filter((b) => b.weakOpener)
        if (weak.length > 0 && attempt === 0) {
          const quoted = weak.slice(0, 2).map((b) => `"${b.text.slice(0, 60)}"`).join(", ")
          retryNote = language === "en"
            ? `Your last answer opened a bullet with a duty phrase: ${quoted}. Rewrite every bullet so it opens with the action itself.`
            : `Tu respuesta anterior abrió una viñeta con una frase de tarea: ${quoted}. Reescribí cada viñeta para que abra con la acción en sí.`
          this.logger.warn("[AIService.fillProfile] assistant bullet opened with a duty phrase — retrying once", { count: weak.length })
          continue
        }
        // Our text, so our typos. "Creeé matrices de test" reached a real CV
        // because this path never ran the shared cleaner every other generated
        // line runs through.
        cleanLines = await cleanGeneratedText(cleanLines, language === "en" ? "en" : "es", sectionData ?? {})
      }

      return {
        // The first one is what a caller that ignores the choice would apply.
        summary: summaries[0] ?? null,
        summaries,
        jobTitle: parsed.jobTitle?.trim() || null,
        hobbies: null,
        suggestedSkills: [],
        // Catalog spelling where we know the skill, the model's where we do not
        // — the same rule the extraction path applies, for the same reason.
        inferredSkills: skills.map((s) => canonicalSkillName(s) ?? s.trim()).slice(0, 8),
        suggestedCertifications: certs.slice(0, 6),
        educationNew: [],
        suggestedLanguages: [],
        workExperienceUpdates: [],
        workExperienceNew: [],
        educationUpdates: [],
        projectUpdates: [],
        volunteerUpdates: [],
        // Only the bullets mode fills this; the panel writes them into the role
        // it asked about, which is the only one that knows the id.
        bullets: cleanLines.slice(0, 6),
      }
    }

    // Twice empty on a task this short means the answer really is not coming.
    throw new AppError(empty ? "off_topic" : "ai_error", 422)
    } finally {
      // Billed against the model that actually ran — the cost table is per model,
      // so recording the extractor's price for a prose call would understate it.
      const promptTokens = usages.reduce((n, u) => n + (u.prompt_tokens ?? 0), 0)
      const completionTokens = usages.reduce((n, u) => n + (u.completion_tokens ?? 0), 0)
      if (usages.length > 0) {
        logAIUsage(userId, "fill-profile", {
          model,
          plan,
          promptTokens,
          completionTokens,
          costUsd: computeCostUsd(model, promptTokens, completionTokens),
        })
      }
    }
  }
}
