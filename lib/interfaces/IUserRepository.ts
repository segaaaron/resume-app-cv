export interface UserAuthRecord {
  id: string
  name: string | null
  email: string
  hasPassword: boolean
  referralCode: string | null
}

export interface PendingRecord {
  email: string
  name: string
  passwordHash: string
  marketingConsent: boolean
  ageConsent: boolean
  referralCode: string | null
  otpHash: string
  otpExp: Date
  attempts: number
}

export interface SessionChallengeUser {
  id: string
  name: string | null
  activeSessionToken: string | null
  sessionChallengeCode: string | null
  sessionChallengeExp: Date | null
  sessionChallengeAttempts: number
  sessionChallengeBlockedUntil: Date | null
}

export interface SessionChallengeUpdate {
  sessionChallengeCode?: string | null
  sessionChallengeExp?: Date | null
  sessionChallengeAttempts?: number
  sessionChallengeBlockedUntil?: Date | null
  activeSessionToken?: string | null
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserAuthRecord | null>
  findByReferralCode(code: string): Promise<{ id: string } | null>
  createFromPending(pending: PendingRecord, referralCode: string, referrerId?: string): Promise<void>
  findForReset(email: string): Promise<{ id: string; name: string | null; hasPassword: boolean } | null>
  updatePassword(userId: string, passwordHash: string): Promise<void>
  findForChallenge(email: string): Promise<SessionChallengeUser | null>
  updateSessionChallenge(userId: string, data: SessionChallengeUpdate): Promise<void>
}
