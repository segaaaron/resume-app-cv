import type { PendingRecord } from "@/lib/interfaces/IUserRepository"

export interface PendingUpsertData {
  email: string
  name: string
  passwordHash: string
  marketingConsent: boolean
  ageConsent: boolean
  referralCode: string | null
  otpHash: string
  otpExp: Date
}

export interface IPendingRegistrationRepository {
  findByEmail(email: string): Promise<PendingRecord | null>
  upsert(data: PendingUpsertData): Promise<void>
  updateAttempts(email: string, attempts: number): Promise<void>
  deleteByEmail(email: string): Promise<void>
}
