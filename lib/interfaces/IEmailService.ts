export interface IEmailService {
  sendRegistrationOtp(to: string, name: string, code: string, locale?: string | null): Promise<void>
  sendPasswordResetOtp(to: string, name: string, code: string, locale?: string | null): Promise<void>
  sendSessionChallenge(to: string, name: string, code: string, locale?: string | null): Promise<void>
  sendSessionChallengeFailed(to: string, name: string, attemptsLeft: number, locale?: string | null): Promise<void>
  sendSessionChallengeBlocked(to: string, name: string, unblockedAt: Date, locale?: string | null): Promise<void>
  sendSessionForced(to: string, name: string, locale?: string | null): Promise<void>
}
