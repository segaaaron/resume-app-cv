export interface ISessionRepository {
  clearActiveSession(userId: string): Promise<void>
}
