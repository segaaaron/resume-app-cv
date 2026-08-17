// Single source of truth for resume section-header icons.
//
// Why this exists: templates used to hand-roll (or omit) section icons, so only a
// handful had the elegant per-section glyphs (briefcase, graduation cap…) that
// premium competitors show. This maps each canonical section id → one lucide icon
// so every template renders the SAME, consistent iconography — no parallel lists,
// no per-template drift. Templates opt in via <SectionIcon sectionId=… />.
//
// Design rules honored: one icon family (lucide), consistent stroke, accent-color
// aware (inherits the template's color), decorative (aria-hidden) since the text
// label always sits beside it. Unknown ids render nothing — a safe no-op, never a
// broken glyph.

import {
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Globe,
  Award,
  FolderKanban,
  HeartHandshake,
  Users,
  Palette,
  Contact,
  type LucideIcon,
} from "lucide-react"

/** Canonical section id → lucide icon. Keys match the section ids used in TEMPLATES. */
const SECTION_ICONS: Record<string, LucideIcon> = {
  summary: User,
  workExperience: Briefcase,
  education: GraduationCap,
  skills: Wrench,
  languages: Globe,
  certifications: Award,
  projects: FolderKanban,
  volunteer: HeartHandshake,
  references: Users,
  hobbies: Palette,
  personalDetails: Contact,
}

/** The lucide icon for a section id, or null when none is mapped (safe no-op). */
export function getSectionIcon(sectionId: string | undefined | null): LucideIcon | null {
  if (!sectionId) return null
  return SECTION_ICONS[sectionId] ?? null
}

export interface SectionIconProps {
  /** Canonical section id (e.g. "workExperience"). Unknown ids render nothing. */
  sectionId: string | undefined | null
  /** Pixel size of the square icon. Default 14 — tuned for a section-header line. */
  size?: number
  /** Stroke color. Pass the template's accent so the icon reads as native. */
  color?: string
  /** Stroke width. Default 2 (lucide default) — keep uniform within a template. */
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * Renders the section's icon inline. Decorative (aria-hidden) — the localized
 * section label always accompanies it, so it adds polish without hurting screen
 * readers or ATS text extraction (SVG carries no text). Returns null for
 * unmapped sections, so a template can wire it into every header unconditionally.
 */
export function SectionIcon({
  sectionId,
  size = 14,
  color,
  strokeWidth = 2,
  className,
  style,
}: SectionIconProps) {
  // Not a component created during render: `getSectionIcon` LOOKS UP a stable lucide
  // component in a module-level map, so its identity never changes between renders and
  // React has nothing to remount. The rule cannot see through the lookup.
  // eslint-disable-next-line react-hooks/static-components
  const Icon = getSectionIcon(sectionId)
  if (!Icon) return null
  return (
    // eslint-disable-next-line react-hooks/static-components
    <Icon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      aria-hidden
    />
  )
}
