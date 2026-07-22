"use client"

import React, { useEffect, useRef, useState } from "react"
import { Pen, Copy, Trash2, Loader2, Languages } from "lucide-react"
import { useTranslations } from "next-intl"
import { ResumeThumbnail } from "@/components/editor/template-switcher/thumbnails"
import { TEMPLATES } from "@/types/resume"
import { formatInTimezone } from "@/hooks/useUserTimezone"
import type { Locale } from "date-fns"
import { getAnimationDelay, DDItem } from "./_cv-card-sub"

export { NewCVCard } from "./_cv-card-sub"

export interface ResumeCard {
  id: string
  title: string
  templateId: string
  colorScheme: string
  thumbnailUrl: string | null
  updatedAt: Date
  createdAt: Date
}

interface CVCardProps {
  resume: ResumeCard
  locale: string
  userTimezone: string
  dateLocale: Locale
  isDownloading: boolean
  index: number
  onEdit: () => void
  onRename: () => void
  onDuplicate: () => void
  onTranslate: () => void
  onDownload: () => void
  onDelete: () => void
}


const CVCard = React.memo(function CVCard({
  resume,
  locale: _locale,
  userTimezone,
  dateLocale,
  isDownloading,
  index,
  onEdit,
  onRename,
  onDuplicate,
  onTranslate,
  onDownload,
  onDelete,
}: CVCardProps) {
  const t = useTranslations("dashboard.resumes")
  const [ddOpen, setDdOpen] = useState(false)
  const ddRef = useRef<HTMLDivElement>(null)

  const templateName =
    TEMPLATES.find((tmpl) => tmpl.id === resume.templateId)?.name ?? t("default_template")

  // Close dropdown on outside click
  useEffect(() => {
    if (!ddOpen) return
    function handleClick(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        setDdOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [ddOpen])

  return (
    <div
      className="group dash-card-in block relative overflow-visible cursor-pointer rounded-[10px] bg-white border border-dash-border hover:bg-dash-surface hover:border-dash-cyan hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,212,255,0.12)] transition-[border-color,background,transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.34,1.2,0.64,1)]"
      style={{
        zIndex: ddOpen ? 10 : "auto",
        animationDelay: getAnimationDelay(index),
      }}
    >
      {/* Bottom glow line — simulates ::after */}
      <div
        className="absolute bottom-0 left-[20%] right-[20%] h-px pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-[250ms] z-0"
        style={{ background: "#00D4FF", filter: "blur(2px)" }}
      />

      {/* Thumbnail wrap */}
      <div
        onClick={onEdit}
        className="relative flex items-end justify-center overflow-hidden rounded-t-[10px] pt-[18px] px-7 min-h-[140px]"
        style={{ background: "linear-gradient(135deg, #F5F7FB 0%, #EEF2F9 100%)" }}
      >
        {/* Radial glow overlay — simulates ::before */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.03) 0%, transparent 65%)" }}
        />

        {/* Paper thumbnail */}
        <div
          className="w-full overflow-hidden relative max-w-[118px] rounded-t-[2px] z-[1] transition-transform duration-[220ms] ease-[cubic-bezier(0.34,1.2,0.64,1)] group-hover:-translate-y-[6px] group-hover:scale-[1.03]"
          style={{
            aspectRatio: "210 / 297",
            boxShadow: "0 -2px 20px rgba(0,0,0,0.08), 0 0 0 1px #D9E1ED",
          }}
        >
          {resume.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resume.thumbnailUrl}
              alt={resume.title}
              className="w-full h-full block object-cover object-top"
            />
          ) : (
            <ResumeThumbnail id={resume.templateId} color={resume.colorScheme} />
          )}
        </div>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[5] backdrop-blur-[2px]"
          style={{ background: "rgba(26,46,74,0.4)" }}
        >
          <div className="flex flex-col items-center gap-[5px]">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="flex items-center justify-center cursor-pointer w-9 h-9 rounded-full text-dash-cyan border border-dash-cyan/40 bg-dash-cyan/20 hover:bg-dash-cyan/35 hover:scale-[1.08] transition-all duration-150"
            >
              <Pen className="w-[14px] h-[14px]" />
            </button>
            <span className="text-[10px] font-semibold text-dash-cyan tracking-[0.04em] opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-[50ms]">
              {t("edit")}
            </span>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="p-4">
        <div className="text-sm font-semibold text-dash-navy whitespace-nowrap overflow-hidden text-ellipsis mb-[3px] tracking-[-0.01em]">
          {resume.title || t("default_template")}
        </div>
        <div className="flex items-center text-[11.5px] text-dash-muted gap-[5px]">
          <span>{templateName}</span>
          <span className="inline-block flex-shrink-0 rounded-full bg-dash-subtle w-[2.5px] h-[2.5px]" />
          <span>{formatInTimezone(resume.updatedAt, userTimezone, dateLocale)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-[5px] relative overflow-visible mt-[11px] pt-[10px] border-t border-dash-border-s">
          {/* Primary: Renombrar */}
          <button
            type="button"
            onClick={onRename}
            className="inline-flex items-center gap-[5px] font-semibold cursor-pointer min-h-[36px] px-[11px] py-[5px] rounded-[6px] border border-dash-cyan/[0.28] text-[11.5px] tracking-[-0.01em] transition-all duration-150 hover:border-dash-cyan/50 hover:text-dash-cyan"
            style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,168,204,0.06) 100%)",
              color: "#00A8CC",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M9 2l3 3L5 12H2V9L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t("rename")}
          </button>

          {/* More menu — pushed to right */}
          <div ref={ddRef} className="relative ml-auto">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDdOpen((o) => !o) }}
              className="flex items-center justify-center cursor-pointer min-h-[36px] w-[26px] h-[26px] rounded-[5px] border border-dash-border bg-transparent text-dash-muted hover:bg-dash-surface2 hover:text-dash-navy transition-all duration-150"
              aria-label={t("more_options")}
            >
              {/* Three dots icon */}
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="2" r="1" fill="currentColor" />
                <circle cx="5.5" cy="5.5" r="1" fill="currentColor" />
                <circle cx="5.5" cy="9" r="1" fill="currentColor" />
              </svg>
            </button>

            {/* Dropdown menu */}
            <div
              className="absolute right-0 bg-white rounded-[10px] p-2 min-w-[170px] z-[1000] origin-top-right border border-dash-border shadow-[0_8px_32px_rgba(26,46,74,0.12),0_0_0_1px_rgba(0,212,255,0.15)] transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.34,1.1,0.64,1)]"
              style={{
                top: "calc(100% + 6px)",
                opacity: ddOpen ? 1 : 0,
                transform: ddOpen ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.96)",
                pointerEvents: ddOpen ? "all" : "none",
              }}
            >
              <DDItem
                onClick={() => { setDdOpen(false); onDuplicate() }}
                icon={<Copy className="w-[13px] h-[13px]" />}
                label={t("duplicate")}
              />
              <DDItem
                onClick={() => { setDdOpen(false); onTranslate() }}
                icon={<Languages className="w-[13px] h-[13px]" />}
                label={t("translate")}
              />
              <div
                className="my-[6px] h-px"
                style={{ background: "linear-gradient(90deg, transparent, #E8EDF6, transparent)" }}
              />
              {isDownloading ? (
                <DDItem
                  onClick={() => {}}
                  icon={<Loader2 className="w-[13px] h-[13px] animate-spin" />}
                  label={t("download_pdf")}
                  disabled
                />
              ) : (
                <DDItem
                  onClick={() => { setDdOpen(false); onDownload() }}
                  icon={
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 1v7M4 4.5l2.5 3.5 2.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M1 9v1.5a1 1 0 001 1h9a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  }
                  label={t("download_pdf")}
                />
              )}
              <div
                className="my-[6px] h-px"
                style={{ background: "linear-gradient(90deg, transparent, #E8EDF6, transparent)" }}
              />
              <DDItem
                onClick={() => { setDdOpen(false); onDelete() }}
                icon={<Trash2 className="w-[13px] h-[13px]" />}
                label={t("delete")}
                danger
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default CVCard
