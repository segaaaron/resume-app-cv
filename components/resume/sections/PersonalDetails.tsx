"use client"

import { useForm } from "react-hook-form"
import { useEffect } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import type { PersonalDetails } from "@/types/resume"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PersonalDetailsSection() {
  const { sectionData, updateSectionData } = useResumeStore()

  const { register, watch } = useForm<PersonalDetails>({
    defaultValues: sectionData.personalDetails,
  })

  useEffect(() => {
    const sub = watch((values) => {
      updateSectionData("personalDetails", values as PersonalDetails)
    })
    return () => sub.unsubscribe()
  }, [watch, updateSectionData])

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Nombre" id="firstName" register={register("firstName")} />
      <Field label="Apellido" id="lastName" register={register("lastName")} />
      <Field label="Título profesional" id="jobTitle" register={register("jobTitle")} className="col-span-2" />
      <Field label="Email" id="email" type="email" register={register("email")} />
      <Field label="Teléfono" id="phone" register={register("phone")} />
      <Field label="Ciudad" id="city" register={register("city")} />
      <Field label="País" id="country" register={register("country")} />
      <Field label="Código postal" id="postalCode" register={register("postalCode")} />
      <Field label="Dirección" id="address" register={register("address")} />
      <Field label="Sitio web" id="website" register={register("website")} />
      <Field label="LinkedIn" id="linkedin" register={register("linkedin")} />
      <Field label="GitHub" id="github" register={register("github")} />
    </div>
  )
}

function Field({
  label,
  id,
  type = "text",
  register,
  className,
}: {
  label: string
  id: string
  type?: string
  register: ReturnType<ReturnType<typeof useForm>["register"]>
  className?: string
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-xs mb-1 block text-muted-foreground">
        {label}
      </Label>
      <Input id={id} type={type} className="h-8 text-sm" {...register} />
    </div>
  )
}
