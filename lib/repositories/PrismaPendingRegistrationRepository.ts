import { db } from "@/lib/db"
import type { IPendingRegistrationRepository, PendingUpsertData } from "@/lib/interfaces/IPendingRegistrationRepository"
import type { PendingRecord } from "@/lib/interfaces/IUserRepository"

export class PrismaPendingRegistrationRepository implements IPendingRegistrationRepository {
  async findByEmail(email: string): Promise<PendingRecord | null> {
    return db.pendingRegistration.findUnique({ where: { email } })
  }

  async upsert(data: PendingUpsertData): Promise<void> {
    await db.pendingRegistration.upsert({
      where:  { email: data.email },
      create: { ...data, attempts: 0 },
      update: { ...data, attempts: 0 },
    })
  }

  async updateAttempts(email: string, attempts: number): Promise<void> {
    await db.pendingRegistration.update({ where: { email }, data: { attempts } })
  }

  async deleteByEmail(email: string): Promise<void> {
    await db.pendingRegistration.delete({ where: { email } }).catch(() => {})
  }
}
