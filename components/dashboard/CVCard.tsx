"use client"

import React, { useState, useEffect, useRef } from "react"
import { Pen, Copy, Trash2, Loader2 } from "lucide-react"
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
  onDownload,
  onDelete,
}: CVCardProps) {
  const t = useTranslations("dashboard.resumes")
  const [ddOpen, setDdOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
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
      className="dash-card-in block relative overflow-visible cursor-pointer rounded-[10px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? "#F5F7FB" : "white",
        border: `1px solid ${isHovered ? "#00D4FF" : "#D9E1ED"}`,
        zIndex: ddOpen ? 10 : "auto",
        transition: "border-color 0.22s ease, background 0.22s ease, transform 0.22s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.22s ease",
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: isHovered ? "0 4px 20px rgba(0,212,255,0.12)" : "none",
        animationDelay: getAnimationDelay(index),
      }}
    >
      {/* Bottom glow line — simulates ::after */}
      <div
        className="absolute bottom-0 pointer-events-none"
        style={{
          left: "20%",
          right: "20%",
          height: "1px",
          background: "#00D4FF",
          filter: "blur(2px)",
          opacity: isHovered ? 0.4 : 0,
          transition: "opacity 0.25s ease",
          zIndex: 0,
        }}
      />

      {/* Thumbnail wrap */}
      <div
        onClick={onEdit}
        className="relative flex items-end justify-center overflow-hidden rounded-t-[10px]"
        style={{
          background: "linear-gradient(135deg, #F5F7FB 0%, #EEF2F9 100%)",
          padding: "18px 28px 0",
          minHeight: "140px",
        }}
      >
        {/* Radial glow overlay — simulates ::before */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.03) 0%, transparent 65%)",
          }}
        />

        {/* Paper thumbnail */}
        <div
          className="w-full overflow-hidden relative"
          style={{
            maxWidth: "118px",
            aspectRatio: "210 / 297",
            borderRadius: "2px 2px 0 0",
            boxShadow: "0 -2px 20px rgba(0,0,0,0.08), 0 0 0 1px #D9E1ED",
            zIndex: 1,
            transition: "transform 0.22s cubic-bezier(0.34,1.2,0.64,1)",
            transform: isHovered ? "translateY(-6px) scale(1.03)" : "translateY(0) scale(1)",
          }}
        >
          {resume.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resume.thumbnailUrl}
              alt={resume.title}
              className="w-full h-full block"
              style={{ objectFit: "cover", objectPosition: "top" }}
            />
          ) : (
            <ResumeThumbnail id={resume.templateId} color={resume.colorScheme} />
          )}
        </div>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: "rgba(26,46,74,0.4)",
            backdropFilter: "blur(2px)",
            gap: "8px",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.2s ease",
            zIndex: 5,
          }}
        >
          <div className="flex flex-col items-center" style={{ gap: "5px" }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(0,212,255,0.2)",
                border: "1px solid rgba(0,212,255,0.4)",
                color: "#00D4FF",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,212,255,0.35)"
                e.currentTarget.style.transform = "scale(1.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0,212,255,0.2)"
                e.currentTarget.style.transform = "scale(1)"
              }}
            >
              <Pen style={{ width: "14px", height: "14px" }} />
            </button>
            <span
              className="text-[10px] font-semibold text-[#00D4FF]"
              style={{
                letterSpacing: "0.04em",
                opacity: isHovered ? 1 : 0,
                transition: "opacity 0.2s ease 0.05s",
              }}
            >
              {t("edit")}
            </span>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="p-4">
        <div
          className="text-sm font-semibold text-[#1a2e4a] whitespace-nowrap overflow-hidden text-ellipsis mb-[3px]"
          style={{ letterSpacing: "-0.01em" }}
        >
          {resume.title || t("default_template")}
        </div>
        <div
          className="flex items-center text-[#6B7A8C]"
          style={{ fontSize: "11.5px", gap: "5px" }}
        >
          <span>{templateName}</span>
          <span
            className="inline-block flex-shrink-0 rounded-full bg-[#A0AABE]"
            style={{ width: "2.5px", height: "2.5px" }}
          />
          <span>{formatInTimezone(resume.updatedAt, userTimezone, dateLocale)}</span>
        </div>

        {/* Actions */}
        <div
          className="flex items-center relative overflow-visible mt-[11px] pt-[10px] border-t border-[#E8EDF6]"
          style={{ gap: "5px" }}
        >
          {/* Primary: Renombrar */}
          <button
            type="button"
            onClick={onRename}
            className="inline-flex items-center font-semibold cursor-pointer min-h-[36px]"
            style={{
              gap: "5px",
              padding: "5px 11px",
              borderRadius: "6px",
              border: "1px solid rgba(0,212,255,0.28)",
              background: "linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,168,204,0.06) 100%)",
              color: "#00A8CC",
              fontSize: "11.5px",
              fontWeight: 600,
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(0,212,255,0.18) 0%, rgba(0,168,204,0.1) 100%)"
              e.currentTarget.style.borderColor = "rgba(0,212,255,0.5)"
              e.currentTarget.style.color = "#00D4FF"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,168,204,0.06) 100%)"
              e.currentTarget.style.borderColor = "rgba(0,212,255,0.28)"
              e.currentTarget.style.color = "#00A8CC"
            }}
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M9 2l3 3L5 12H2V9L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t("rename")}
          </button>

          {/* More menu — pushed to right */}
          <div
            ref={ddRef}
            className="relative ml-auto"
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDdOpen((o) => !o) }}
              className="flex items-center justify-center cursor-pointer min-h-[36px]"
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "5px",
                border: "1px solid #D9E1ED",
                background: "transparent",
                color: "#6B7A8C",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#EEF2F9"
                e.currentTarget.style.color = "#1a2e4a"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "#6B7A8C"
              }}
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
              className="absolute right-0 bg-white rounded-[10px] p-2"
              style={{
                top: "calc(100% + 6px)",
                border: "1px solid #D9E1ED",
                minWidth: "170px",
                zIndex: 1000,
                boxShadow: "0 8px 32px rgba(26,46,74,0.12), 0 0 0 1px rgba(0,212,255,0.15)",
                opacity: ddOpen ? 1 : 0,
                transform: ddOpen ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.96)",
                pointerEvents: ddOpen ? "all" : "none",
                transition: "opacity 0.18s cubic-bezier(0.34,1.1,0.64,1), transform 0.18s cubic-bezier(0.34,1.1,0.64,1)",
                transformOrigin: "top right",
              }}
            >
              <DDItem
                onClick={() => { setDdOpen(false); onDuplicate() }}
                icon={<Copy style={{ width: "13px", height: "13px" }} />}
                label={t("duplicate")}
              />
              <div
                className="my-[6px]"
                style={{
                  height: "1px",
                  background: "linear-gradient(90deg, transparent, #E8EDF6, transparent)",
                }}
              />
              {isDownloading ? (
                <DDItem
                  onClick={() => {}}
                  icon={<Loader2 style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite" }} />}
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
                className="my-[6px]"
                style={{
                  height: "1px",
                  background: "linear-gradient(90deg, transparent, #E8EDF6, transparent)",
                }}
              />
              <DDItem
                onClick={() => { setDdOpen(false); onDelete() }}
                icon={<Trash2 style={{ width: "13px", height: "13px" }} />}
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
