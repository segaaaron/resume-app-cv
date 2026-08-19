import { describe, it, expect } from "vitest"
import { buildProfileWrites, type GeneratedProfile } from "@/lib/editor/apply-profile"
import type { WorkExperienceItem, EducationItem, SkillItem, CertificationItem } from "@/types/resume"

const get = (writes: ReturnType<typeof buildProfileWrites>["writes"], key: string) =>
  writes.find((w) => w.key === key)?.value

/** What the model returns for "I'm a telecommunications engineer with 5 years". */
const FULL: GeneratedProfile = {
  jobTitle: "Ingeniero de Telecomunicaciones",
  summary: "Ingeniero de telecomunicaciones con cinco años de experiencia en redes de transporte y acceso.",
  suggestedSkills: ["MPLS"],
  inferredSkills: ["Fibra óptica", "BGP"],
  suggestedCertifications: ["CCNA", "ITIL Foundation"],
  workExperienceNew: [{
    jobTitle: "Ingeniero de Telecomunicaciones",
    employer: "",
    description: "• Configuré equipamiento sobre redes IP/MPLS",
  }],
}

describe("buildProfileWrites", () => {
  // The point of the whole thing: one answer produces a document, not a stack
  // of cards to press Apply on.
  it("builds the whole CV from one response", () => {
    const { writes, applied } = buildProfileWrites(FULL, {})
    expect(applied).toEqual({
      jobTitle: true, summary: true, skills: 3,
      certifications: 2, experience: 1, education: 0,
    })
    expect(writes.map((w) => w.key).sort()).toEqual(
      ["certifications", "personalDetails", "skills", "summary", "workExperience"]
    )
  })

  it("writes the role with the employer left empty, never invented", () => {
    const { writes } = buildProfileWrites(FULL, {})
    const jobs = get(writes, "workExperience") as WorkExperienceItem[]
    expect(jobs).toHaveLength(1)
    expect(jobs[0].jobTitle).toBe("Ingeniero de Telecomunicaciones")
    expect(jobs[0].employer).toBe("")
    expect(jobs[0].startDate).toBe("")
    expect(jobs[0].description).toContain("MPLS")
  })

  it("keeps both skill lists and drops what the CV already had", () => {
    const { writes, applied } = buildProfileWrites(FULL, {
      skills: [{ id: "s1", name: "mpls", level: "intermediate" }] as SkillItem[],
    })
    const skills = get(writes, "skills") as SkillItem[]
    expect(skills.map((s) => s.name)).toEqual(["mpls", "Fibra óptica", "BGP"])
    expect(applied.skills).toBe(2)
  })

  it("does not add a certification the CV already lists", () => {
    const { applied } = buildProfileWrites(FULL, {
      certifications: [{ id: "c1", name: "CCNA", issuer: "", date: "", url: "" }] as CertificationItem[],
    })
    expect(applied.certifications).toBe(1)
  })

  /**
   * Both experience paths write the same section. Computed separately they would
   * be two writes to one key, and the second would erase the first — the rewrite
   * of an existing role lost to the appending of a new one.
   */
  it("merges rewritten and new roles into a single write", () => {
    const existing: WorkExperienceItem[] = [{
      id: "w1", jobTitle: "Analista", employer: "Banco Mercantil", city: "",
      startDate: "05/2010", endDate: "10/2015", currentlyWorking: false, description: "viejo",
    }]
    const { writes } = buildProfileWrites({
      workExperienceUpdates: [{ id: "w1", description: "• Evalué carteras de clientes privados" }],
      workExperienceNew: [{ jobTitle: "Consultor", employer: "", description: "• Asesoré a clientes" }],
    }, { workExperience: existing })

    expect(writes.filter((w) => w.key === "workExperience")).toHaveLength(1)
    const jobs = get(writes, "workExperience") as WorkExperienceItem[]
    expect(jobs).toHaveLength(2)
    expect(jobs[0].description).toBe("• Evalué carteras de clientes privados")
    expect(jobs[0].employer).toBe("Banco Mercantil")
    expect(jobs[1].jobTitle).toBe("Consultor")
  })

  it("appends studies without touching the ones already there", () => {
    const existing: EducationItem[] = [{
      id: "e1", institution: "UMSA", degree: "Bachiller", fieldOfStudy: "", city: "",
      startDate: "", endDate: "", currentlyStudying: false, description: "",
    }]
    const { writes, applied } = buildProfileWrites({
      educationNew: [{ degree: "Ingeniería en Telecomunicaciones", institution: "" }],
    }, { education: existing })

    const edu = get(writes, "education") as EducationItem[]
    expect(edu).toHaveLength(2)
    expect(edu[0].institution).toBe("UMSA")
    expect(edu[1].degree).toBe("Ingeniería en Telecomunicaciones")
    // The university the model was never told stays blank for the user to fill.
    expect(edu[1].institution).toBe("")
    expect(applied.education).toBe(1)
  })

  it("writes nothing when the model returned nothing", () => {
    expect(buildProfileWrites({}, {}).writes).toEqual([])
  })

  it("never writes a section the response did not speak about", () => {
    const { writes } = buildProfileWrites({ summary: "Solo un resumen" }, {})
    expect(writes.map((w) => w.key)).toEqual(["summary"])
  })
})
