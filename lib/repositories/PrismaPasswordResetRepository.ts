import { db } from "@/lib/db"
import type { IPasswordResetRepository, PasswordResetRecord } from "@/lib/interfaces/IPasswordResetRepository"

export class PrismaPasswordResetRepository implements IPasswordResetRepository {
  async findByEmail(email: string): Promise<PasswordResetRecord | null> {
    return db.passwordReset.findUnique({ where: { email } })
  }

  async upsert(email: string, otpHash: string, expiresAt: Date): Promise<void> {
    await db.passwordReset.upsert({
      where:  { email },
      create: { email, otpHash, expiresAt, attempts: 0 },
      update: { otpHash, expiresAt, attempts: 0, usedAt: null },
    })
  }

  async incrementAttempts(email: string): Promise<void> {
    await db.passwordReset.update({ where: { email }, data: { attempts: { increment: 1 } } })
  }

  async markUsed(email: string): Promise<boolean> {
    // Atomic conditional update — only marks used if usedAt is still null.
    // Returns false if a concurrent request already claimed this OTP.
    const result = await db.passwordReset.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    })
    return result.count > 0
  }
}
