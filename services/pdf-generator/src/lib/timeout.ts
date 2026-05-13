/**
 * Wraps a promise with a hard deadline.
 * Rejects with `Error("Timeout: <label> after <ms>ms")` if the promise
 * does not settle within `ms` milliseconds.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout: ${label} after ${ms}ms`)), ms)
    promise.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) },
    )
  })
}
