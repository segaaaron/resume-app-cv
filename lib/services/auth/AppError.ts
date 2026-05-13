export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(code)
    this.name = "AppError"
  }
}
