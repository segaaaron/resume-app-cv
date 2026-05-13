import { db } from "@/lib/db"
import type {
  IUserRepository,
  UserAuthRecord,
  PendingRecord,
  SessionChallengeUser,
  SessionChallengeUpdate,
} from "@/lib/interfaces/IUserRepository"

export class PrismaUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserAuthRecord | null> {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true, referralCode: true },
    })
    if (!user) return null
    return { id: user.id, name: user.name, email: user.email, hasPassword: !!user.password, referralCode: user.referralCode }
  }

  async findByReferralCode(code: string): Promise<{ id: string } | null> {
    return db.user.findUnique({ where: { referralCode: code }, select: { id: true } })
  }

  async createFromPending(pending: PendingRecord, referralCode: string, referrerId?: string): Promise<void> {
    await db.$transaction([
      db.user.create({
        data: {
          name:             pending.name,
          email:            pending.email,
          password:         pending.passwordHash,
          marketingConsent: pending.marketingConsent,
          ageVerified:      pending.ageConsent,
          referralCode,
          emailVerified:    new Date(),
          ...(referrerId ? { referredBy: referrerId } : {}),
        },
      }),
      db.pendingRegistration.delete({ where: { email: pending.email } }),
    ])
  }

  async findForReset(email: string): Promise<{ id: string; name: string | null; hasPassword: boolean } | null> {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, password: true },
    })
    if (!user) return null
    return { id: user.id, name: user.name, hasPassword: !!user.password }
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { password: passwordHash, activeSessionToken: null },
    })
  }

  async findForChallenge(email: string): Promise<SessionChallengeUser | null> {
    return db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        activeSessionToken: true,
        sessionChallengeCode: true,
        sessionChallengeExp: true,
        sessionChallengeAttempts: true,
        sessionChallengeBlockedUntil: true,
      },
    })
  }

  async updateSessionChallenge(userId: string, data: SessionChallengeUpdate): Promise<void> {
    await db.user.update({ where: { id: userId }, data })
  }
}
