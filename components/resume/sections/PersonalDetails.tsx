"use client"

import { useForm } from "react-hook-form"
import { useEffect, useMemo, useRef } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { PersonalDetails } from "@/types/resume"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  UserRound, Briefcase, AtSign, Smartphone,
  MapPin, Globe2, Hash, Building2, Globe,
  Network, Code2, TrendingUp,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

function calcYearsOfExperience(workExperience: { startDate?: string }[]): string {
  if (!workExperience || workExperience.length === 0) return ""
  const currentYear = new Date().getFullYear()
  const earliest = workExperience.reduce((min, job) => {
    const y = parseInt(job.startDate?.match(/\d{4}/)?.[0] || "9999")
    return y < min ? y : min
  }, 9999)
  if (earliest >= 9999) return ""
  return String(currentYear - earliest)
}

export default function PersonalDetailsSection() {
  const t = useTranslations("editor.sections_form")
  const { resumeId, sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ resumeId: s.resumeId, sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )

  const computedYears = useMemo(
    () => calcYearsOfExperience(sectionData.workExperience ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionData.workExperience]
  )

  const { register, watch, reset, setValue } = useForm<PersonalDetails>({
    defaultValues: sectionData.personalDetails,
  })

  useEffect(() => {
    if (!sectionData.personalDetails?.yearsOfExperience && computedYears) {
      setValue("yearsOfExperience", computedYears)
      updateSectionData("personalDetails", {
        ...sectionData.personalDetails,
        yearsOfExperience: computedYears,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedYears])

  const updateRef = useRef(updateSectionData)
  updateRef.current = updateSectionData
  const skipRef = useRef(false)

  useEffect(() => {
    skipRef.current = true
    reset(sectionData.personalDetails)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const sub = watch((values) => {
      if (skipRef.current) { skipRef.current = false; return }
      clearTimeout(timer)
      timer = setTimeout(() => {
        updateRef.current("personalDetails", values as PersonalDetails)
      }, 120)
    })
    return () => { sub.unsubscribe(); clearTimeout(timer) }
  }, [watch])

  return (
    <div className="flex flex-col gap-5">

      {/* ── Identidad ── */}
      <Group label={t("personal.group_identity")}>
        <Field label={t("personal.first_name")} id="firstName" autoComplete="given-name"         register={register("firstName")} icon={UserRound} />
        <Field label={t("personal.last_name")}  id="lastName"  autoComplete="family-name"        register={register("lastName")}  icon={UserRound} />
        <Field label={t("personal.job_title")}  id="jobTitle"  autoComplete="organization-title" register={register("jobTitle")}  icon={Briefcase} span2 />
      </Group>

      <Group label={t("personal.group_contact")}>
        <Field label={t("personal.email")} id="email" type="email" autoComplete="email" register={register("email")} icon={AtSign} />
        <Field label={t("personal.phone")} id="phone" type="tel"   autoComplete="tel"   register={register("phone")} icon={Smartphone} />
      </Group>

      <Group label={t("personal.group_location")}>
        <Field label={t("personal.city")}        id="city"       autoComplete="address-level2" register={register("city")}       icon={MapPin} />
        <Field label={t("personal.country")}     id="country"    autoComplete="country-name"   register={register("country")}   icon={Globe2} />
        <Field label={t("personal.postal_code")} id="postalCode" autoComplete="postal-code"    register={register("postalCode")} icon={Hash} />
        <Field label={t("personal.address")}     id="address"    autoComplete="street-address" register={register("address")}   icon={Building2} />
      </Group>

      <Group label={t("personal.group_online")}>
        <Field label={t("personal.website")}  id="website"  autoComplete="url" register={register("website")}  icon={Globe}    span2 />
        <Field label={t("personal.linkedin")} id="linkedin" autoComplete="off" register={register("linkedin")} icon={Network}  span2 />
        <Field label={t("personal.github")}   id="github"   autoComplete="off" register={register("github")}   icon={Code2}    span2 />
      </Group>

      <Group label={t("personal.group_experience")}>
        <Field label={t("personal.years_of_experience")} id="yearsOfExperience" type="number" autoComplete="off" register={register("yearsOfExperience")} icon={TrendingUp} span2 />
      </Group>

    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#94AABF", textTransform: "uppercase" }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #D4E4F0, transparent)" }} />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        {children}
      </div>
    </div>
  )
}

function Field({
  label, id, type = "text", autoComplete, register, icon: Icon, span2,
}: {
  label: string
  id: string
  type?: string
  autoComplete?: string
  register: ReturnType<ReturnType<typeof useForm>["register"]>
  icon?: LucideIcon
  span2?: boolean
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 mb-1.5"
        style={{ fontSize: 11, fontWeight: 600, color: "#7A9BB5", letterSpacing: "0.01em", textTransform: "capitalize" }}
      >
        {Icon && <Icon size={12} strokeWidth={2} style={{ color: "#5B8FBD", flexShrink: 0 }} />}
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        className="h-9 text-sm w-full"
        style={{ color: "#1A2E4A", paddingLeft: 12, paddingRight: 12 }}
        {...register}
      />
    </div>
  )
}
