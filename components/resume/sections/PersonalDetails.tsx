"use client"

import { useForm } from "react-hook-form"
import { useEffect } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import type { PersonalDetails } from "@/types/resume"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PersonalDetailsSection() {
  const resumeId = useResumeStore((s) => s.resumeId)
  const { sectionData, updateSectionData } = useResumeStore()

  const { register, watch, reset } = useForm<PersonalDetails>({
    defaultValues: sectionData.personalDetails,
  })

  useEffect(() => {
    reset(sectionData.personalDetails)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId])

  useEffect(() => {
    const sub = watch((values) => {
      updateSectionData("personalDetails", values as PersonalDetails)
    })
    return () => sub.unsubscribe()
  }, [watch, updateSectionData])

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Nombre"            id="firstName"  autoComplete="given-name"      register={register("firstName")} />
      <Field label="Apellido"          id="lastName"   autoComplete="family-name"     register={register("lastName")} />
      <Field label="Título profesional" id="jobTitle"  autoComplete="organization-title" register={register("jobTitle")} className="col-span-2" />
      <Field label="Email"             id="email"      type="email" autoComplete="email"        register={register("email")} />
      <Field label="Teléfono"          id="phone"      type="tel"   autoComplete="tel"          register={register("phone")} />
      <Field label="Ciudad"            id="city"       autoComplete="address-level2"  register={register("city")} />
      <Field label="País"              id="country"    autoComplete="country-name"    register={register("country")} />
      <Field label="Código postal"     id="postalCode" autoComplete="postal-code"     register={register("postalCode")} />
      <Field label="Dirección"         id="address"    autoComplete="street-address"  register={register("address")} />
      <Field label="Sitio web"  id="website"  autoComplete="url" register={register("website")} />
      <Field label="LinkedIn"  id="linkedin" autoComplete="off" register={register("linkedin")} className="col-span-2" />
      <Field label="GitHub"    id="github"   autoComplete="off" register={register("github")}   className="col-span-2" />
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
