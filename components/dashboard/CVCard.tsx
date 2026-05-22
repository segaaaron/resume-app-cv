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
      className="dash-card-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? "#F5F7FB" : "white",
        border: `1px solid ${isHovered ? "#00D4FF" : "#D9E1ED"}`,
        borderRadius: "10px",
        overflow: "visible",
        cursor: "pointer",
        display: "block",
        position: "relative",
        zIndex: ddOpen ? 10 : "auto",
        transition: "border-color 0.22s ease, background 0.22s ease, transform 0.22s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.22s ease",
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: isHovered ? "0 4px 20px rgba(0,212,255,0.12)" : "none",
        animationDelay: getAnimationDelay(index),
      }}
    >
      {/* Bottom glow line — simulates ::after */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "20%",
          right: "20%",
          height: "1px",
          background: "#00D4FF",
          filter: "blur(2px)",
          opacity: isHovered ? 0.4 : 0,
          transition: "opacity 0.25s ease",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Thumbnail wrap */}
      <div
        onClick={onEdit}
        style={{
          position: "relative",
          background: "linear-gradient(135deg, #F5F7FB 0%, #EEF2F9 100%)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "18px 28px 0",
          minHeight: "140px",
          overflow: "hidden",
          borderRadius: "10px 10px 0 0",
        }}
      >
        {/* Radial glow overlay — simulates ::before */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.03) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        {/* Paper thumbnail */}
        <div
          style={{
            width: "100%",
            maxWidth: "118px",
            aspectRatio: "210 / 297",
            borderRadius: "2px 2px 0 0",
            overflow: "hidden",
            boxShadow: "0 -2px 20px rgba(0,0,0,0.08), 0 0 0 1px #D9E1ED",
            position: "relative",
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
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
            />
          ) : (
            <ResumeThumbnail id={resume.templateId} color={resume.colorScheme} />
          )}
        </div>

        {/* Hover overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(26,46,74,0.4)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.2s ease",
            zIndex: 5,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(0,212,255,0.2)",
                border: "1px solid rgba(0,212,255,0.4)",
                color: "#00D4FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
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
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "#00D4FF",
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
      <div style={{ padding: "16px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#1a2e4a",
            letterSpacing: "-0.01em",
            marginBottom: "3px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {resume.title || t("default_template")}
        </div>
        <div
          style={{
            fontSize: "11.5px",
            color: "#6B7A8C",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>{templateName}</span>
          <span
            style={{
              width: "2.5px",
              height: "2.5px",
              borderRadius: "50%",
              background: "#A0AABE",
              flexShrink: 0,
              display: "inline-block",
            }}
          />
          <span>{formatInTimezone(resume.updatedAt, userTimezone, dateLocale)}</span>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            marginTop: "11px",
            paddingTop: "10px",
            borderTop: "1px solid #E8EDF6",
            overflow: "visible",
            position: "relative",
          }}
        >
          {/* Primary: Renombrar */}
          <button
            type="button"
            onClick={onRename}
            style={{
              display: "inline-flex",
              alignItems: "center",
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
              cursor: "pointer",
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
            style={{ marginLeft: "auto", position: "relative" }}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDdOpen((o) => !o) }}
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "5px",
                border: "1px solid #D9E1ED",
                background: "transparent",
                color: "#6B7A8C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
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
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                background: "white",
                border: "1px solid #D9E1ED",
                borderRadius: "10px",
                padding: "8px",
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
                style={{
                  height: "1px",
                  background: "linear-gradient(90deg, transparent, #E8EDF6, transparent)",
                  margin: "6px 0",
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
                style={{
                  height: "1px",
                  background: "linear-gradient(90deg, transparent, #E8EDF6, transparent)",
                  margin: "6px 0",
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

