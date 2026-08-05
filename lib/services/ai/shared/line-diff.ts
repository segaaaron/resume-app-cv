// lib/services/ai/shared/line-diff.ts
//
// Line-level diff for the "confirm this change" modal.
//
// The modal used to show the whole field before and the whole field after. On a
// summary that is fine; on a work-experience description with seven bullets it
// is two walls of nearly identical text, the changed line is somewhere in the
// middle, and the "after" block sits below the fold — the user confirms without
// ever seeing what changed. Reported verbatim: "it's very hard to tell which one
// is the improvement or which bullet you're changing".
//
// So we diff by line and let the UI show only what moved. Classic LCS: lines
// present in both, in order, are context; the rest are removals and additions.
// Pure and dependency-free.

export type DiffOp = "same" | "added" | "removed"

export interface DiffLine {
  op: DiffOp
  text: string
}

/** Split into comparable lines, dropping blank ones (they carry no meaning here). */
function toLines(value: string): string[] {
  return value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
}

/**
 * Diff two versions of a field by line.
 *
 * Returns every line in reading order tagged `same` / `added` / `removed`, so
 * the caller can dim the untouched ones and highlight the change. A pure append
 * yields all the originals as `same` plus one `added` — exactly the shape the UI
 * needs to say "this line is being added" instead of reprinting the field.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = toLines(before)
  const b = toLines(after)

  // LCS table over line equality. Résumé fields are tens of lines at most, so
  // the quadratic table is irrelevant in practice.
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ op: "same", text: a[i] })
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ op: "removed", text: a[i] })
      i++
    } else {
      out.push({ op: "added", text: b[j] })
      j++
    }
  }
  while (i < a.length) out.push({ op: "removed", text: a[i++] })
  while (j < b.length) out.push({ op: "added", text: b[j++] })

  return out
}

/** True when nothing but untouched lines came back — nothing to confirm. */
export function isNoOpDiff(diff: DiffLine[]): boolean {
  return diff.every((d) => d.op === "same")
}
