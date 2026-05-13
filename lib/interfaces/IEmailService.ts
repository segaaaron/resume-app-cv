export interface IEmailService {
  sendRegistrationOtp(to: string, name: string, code: string): Promise<void>
  sendPasswordResetOtp(to: string, name: string, code: string): Promise<void>
  sendSessionChallenge(to: string, name: string, code: string): Promise<void>
  sendSessionChallengeFailed(to: string, name: string, attemptsLeft: number): Promise<void>
  sendSessionChallengeBlocked(to: string, name: string, unblockedAt: Date): Promise<void>
  sendSessionForced(to: string, name: string): Promise<void>
}
