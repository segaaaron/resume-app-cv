"use client"

import { useForm } from "react-hook-form"
import { useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { PersonalDetails } from "@/types/resume"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    reset(sectionData.personalDetails)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId])

  // Pre-fill with computed years only if field is empty
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

  useEffect(() => {
    const sub = watch((values) => {
      updateSectionData("personalDetails", values as PersonalDetails)
    })
    return () => sub.unsubscribe()
  }, [watch, updateSectionData])

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label={t("personal.first_name")}  id="firstName"  autoComplete="given-name"         register={register("firstName")} />
      <Field label={t("personal.last_name")}   id="lastName"   autoComplete="family-name"        register={register("lastName")} />
      <Field label={t("personal.job_title")}   id="jobTitle"   autoComplete="organization-title" register={register("jobTitle")} className="col-span-2" />
      <Field label={t("personal.email")}       id="email"      type="email" autoComplete="email"        register={register("email")} />
      <Field label={t("personal.phone")}       id="phone"      type="tel"   autoComplete="tel"          register={register("phone")} />
      <Field label={t("personal.city")}        id="city"       autoComplete="address-level2"     register={register("city")} />
      <Field label={t("personal.country")}     id="country"    autoComplete="country-name"       register={register("country")} />
      <Field label={t("personal.postal_code")} id="postalCode" autoComplete="postal-code"        register={register("postalCode")} />
      <Field label={t("personal.address")}     id="address"    autoComplete="street-address"     register={register("address")} />
      <Field label={t("personal.website")}     id="website"    autoComplete="url"                register={register("website")} />
      <Field label={t("personal.linkedin")}    id="linkedin"   autoComplete="off"                register={register("linkedin")} className="col-span-2" />
      <Field label={t("personal.github")}      id="github"     autoComplete="off"                register={register("github")}   className="col-span-2" />
      <Field label={t("personal.years_of_experience")} id="yearsOfExperience" type="number" autoComplete="off" register={register("yearsOfExperience")} className="col-span-2" />
    </div>
  )
}

function Field({
  label,
  id,
  type = "text",
  autoComplete,
  register,
  className,
}: {
  label: string
  id: string
  type?: string
  autoComplete?: string
  register: ReturnType<ReturnType<typeof useForm>["register"]>
  className?: string
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-xs mb-1 block text-muted-foreground">
        {label}
      </Label>
      <Input id={id} type={type} autoComplete={autoComplete} className="h-8 text-sm" {...register} />
    </div>
  )
}
