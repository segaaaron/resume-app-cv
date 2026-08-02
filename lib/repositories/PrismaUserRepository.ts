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
      select: { id: true, name: true, email: true, password: true, referralCode: true, plan: true },
    })
    if (!user) return null
    return { id: user.id, name: user.name, email: user.email, hasPassword: !!user.password, referralCode: user.referralCode, plan: user.plan }
  }

  async findByReferralCode(code: string): Promise<{ id: string } | null> {
    return db.user.findUnique({ where: { referralCode: code }, select: { id: true } })
  }

  async createFromPending(pending: PendingRecord, referralCode: string, referrerId?: string, preferredLocale?: string | null): Promise<void> {
    await db.$transaction([
      db.user.create({
        data: {
          name:             pending.name,
          email:            pending.email,
          password:         pending.passwordHash,
          marketingConsent: pending.marketingConsent,
          ageVerified:      pending.ageConsent,
          termsAcceptedAt:  new Date(),
          referralCode,
          emailVerified:    new Date(),
          // Captured at sign-up so a cron or a webhook can write to this person in a
          // language they read — neither has a request to infer it from.
          ...(preferredLocale ? { preferredLocale } : {}),
          ...(referrerId ? { referredBy: referrerId } : {}),
        },
      }),
      db.pendingRegistration.delete({ where: { email: pending.email } }),
    ])
  }

  async findForReset(email: string): Promise<{ id: string; name: string | null; hasPassword: boolean; plan: string; oauthProvider: string | null } | null> {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        password: true,
        plan: true,
        accounts: { select: { provider: true }, take: 1 },
      },
    })
    if (!user) return null
    return {
      id: user.id,
      name: user.name,
      hasPassword: !!user.password,
      plan: user.plan,
      oauthProvider: user.accounts[0]?.provider ?? null,
    }
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
    // Use { increment: 1 } when only incrementing attempts to avoid TOCTOU.
    // The caller passes the raw number; we convert it to an atomic increment
    // so concurrent wrong-code submissions can't skip attempt slots.
    const { sessionChallengeAttempts, ...rest } = data
    await db.user.update({
      where: { id: userId },
      data: {
        ...rest,
        ...(sessionChallengeAttempts !== undefined
          ? { sessionChallengeAttempts: { increment: 1 } }
          : {}),
      },
    })
  }
}
