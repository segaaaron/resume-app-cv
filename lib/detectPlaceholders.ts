// Detects unfilled AI-generated placeholders like [X%], [N users], [$Z], [X years] in resume data

const PLACEHOLDER_RE = /\[[A-Z$][^\]]{0,20}\]/g

function scanText(text: unknown): number {
  if (typeof text !== "string") return 0
  return (text.match(PLACEHOLDER_RE) ?? []).length
}

export function detectPlaceholders(sectionData: Record<string, unknown>): number {
  let count = 0

  count += scanText(sectionData.summary)

  const workExp = (sectionData.workExperience ?? []) as { description?: string }[]
  workExp.forEach((j) => { count += scanText(j.description) })

  const education = (sectionData.education ?? []) as { description?: string }[]
  education.forEach((e) => { count += scanText(e.description) })

  const projects = (sectionData.projects ?? []) as { description?: string }[]
  projects.forEach((p) => { count += scanText(p.description) })

  const volunteer = (sectionData.volunteer ?? []) as { description?: string }[]
  volunteer.forEach((v) => { count += scanText(v.description) })

  return count
}
