export interface PasswordResetRecord {
  email: string
  otpHash: string
  expiresAt: Date
  attempts: number
  usedAt: Date | null
}

export interface IPasswordResetRepository {
  findByEmail(email: string): Promise<PasswordResetRecord | null>
  upsert(email: string, otpHash: string, expiresAt: Date): Promise<void>
  incrementAttempts(email: string): Promise<void>
  markUsed(email: string): Promise<boolean>
}
