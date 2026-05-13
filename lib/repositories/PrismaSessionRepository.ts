import { db } from "@/lib/db"
import type { ISessionRepository } from "@/lib/interfaces/ISessionRepository"

export class PrismaSessionRepository implements ISessionRepository {
  async clearActiveSession(userId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: {
        activeSessionToken:           null,
        sessionChallengeCode:         null,
        sessionChallengeExp:          null,
        sessionChallengeAttempts:     0,
        sessionChallengeBlockedUntil: null,
      },
    })
  }
}
