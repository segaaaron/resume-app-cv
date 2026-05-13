export function getResumeLabels(lang: string) {
  const isEn = lang === "en"
  return {
    contact:        isEn ? "Contact"        : "Contacto",
    skills:         isEn ? "Skills"         : "Habilidades",
    education:      isEn ? "Education"      : "Educación",
    experience:     isEn ? "Experience"     : "Experiencia",
    hobbies:        isEn ? "Hobbies"        : "Pasatiempos",
    aboutMe:        isEn ? "About Me"       : "Sobre mí",
    profile:        isEn ? "Profile"        : "Perfil",
    summary:        isEn ? "Summary"        : "Resumen",
    languages:      isEn ? "Languages"      : "Idiomas",
    references:     isEn ? "References"     : "Referencias",
    certifications: isEn ? "Certifications" : "Certificaciones",
    projects:       isEn ? "Projects"       : "Proyectos",
    achievements:   isEn ? "Achievements"   : "Logros",
    awards:         isEn ? "Awards"         : "Premios",
    present:        isEn ? "Present"        : "Presente",
    work:           isEn ? "Work"           : "Trabajo",
    volunteer:      isEn ? "Volunteer"      : "Voluntariado",
    publications:   isEn ? "Publications"   : "Publicaciones",
    interests:      isEn ? "Interests"      : "Intereses",
    objective:      isEn ? "Objective"      : "Objetivo",
  }
}
