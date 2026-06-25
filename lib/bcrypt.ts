// Drop-in bcrypt shim backed by @node-rs/bcrypt (Rust, runs on the libuv
// threadpool — does NOT block the Node event loop like the pure-JS `bcryptjs`).
// Same standard bcrypt format ($2a/$2b), so existing hashes remain verifiable.
// Keeps the bcryptjs call surface (`hash(data, rounds)`, `compare(data, hash)`)
// so call sites don't change.
import { hash as nodeHash, verify as nodeVerify } from "@node-rs/bcrypt"

export function hash(data: string, rounds: number): Promise<string> {
  return nodeHash(data, rounds)
}

export async function compare(data: string, hash: string): Promise<boolean> {
  // bcryptjs returns false for malformed/empty hashes; @node-rs/bcrypt throws when
  // the hash is null/non-string. Preserve bcryptjs semantics so call sites that
  // relied on a falsy result (rather than a thrown error) keep working.
  try {
    return await nodeVerify(data, hash)
  } catch {
    return false
  }
}

export default { hash, compare }
