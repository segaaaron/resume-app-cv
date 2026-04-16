"use client"

import type { ResumeSection } from "@/types/resume"
import PersonalDetailsSection from "@/components/resume/sections/PersonalDetails"
import SummarySection from "@/components/resume/sections/Summary"
import WorkExperienceSection from "@/components/resume/sections/WorkExperience"
import EducationSection from "@/components/resume/sections/Education"
import SkillsSection from "@/components/resume/sections/Skills"
import LanguagesSection from "@/components/resume/sections/Languages"
import CertificationsSection from "@/components/resume/sections/Certifications"
import ProjectsSection from "@/components/resume/sections/Projects"
import VolunteerSection from "@/components/resume/sections/Volunteer"
import ReferencesSection from "@/components/resume/sections/References"
import HobbiesSection from "@/components/resume/sections/Hobbies"

export default function SectionContent({ section }: { section: ResumeSection }) {
  switch (section.type) {
    case "personalDetails": return <PersonalDetailsSection />
    case "summary": return <SummarySection />
    case "workExperience": return <WorkExperienceSection />
    case "education": return <EducationSection />
    case "skills": return <SkillsSection />
    case "languages": return <LanguagesSection />
    case "certifications": return <CertificationsSection />
    case "projects": return <ProjectsSection />
    case "volunteer": return <VolunteerSection />
    case "references": return <ReferencesSection />
    case "hobbies": return <HobbiesSection />
    default: return <p className="text-sm text-muted-foreground">Sección no disponible</p>
  }
}
