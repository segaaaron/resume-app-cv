/**
 * Guard against MISSING_MESSAGE errors reaching production.
 *
 * next-intl only fails at RUNTIME when a component calls t("key") for a key that
 * was never added to messages/*.json — it renders a red console error and the raw
 * key path to the user. `dashboard.resumes.translate_done` and `editor.save_error`
 * both shipped that way, so this scans the source for t("…") calls and asserts every
 * one resolves in BOTH locales.
 *
 * Heuristic by necessity: it resolves the namespaces a file declares via
 * useTranslations("ns") / getTranslations("ns") and accepts a key if ANY of them
 * resolves it. Dynamic keys (template literals, variables) are skipped — they can't
 * be checked statically.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "fs"
import { join } from "path"
import en from "@/messages/en.json"
import es from "@/messages/es.json"

const ROOT = process.cwd()
const SCAN_DIRS = ["app", "components"]

/** Files whose keys are intentionally unresolved (dead/unreferenced components). */
const IGNORED_FILES = new Set<string>([])

type Messages = Record<string, unknown>

function resolve(messages: Messages, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Messages)[part] : undefined), messages)
}

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) collectSourceFiles(full, out)
    else if (/\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

interface Usage {
  file: string
  namespaces: string[]
  key: string
}

function collectUsages(): Usage[] {
  const usages: Usage[] = []
  for (const dir of SCAN_DIRS) {
    for (const file of collectSourceFiles(join(ROOT, dir))) {
      const rel = file.slice(ROOT.length + 1)
      if (IGNORED_FILES.has(rel)) continue
      const src = readFileSync(file, "utf8")
      const namespaces = [
        // t = useTranslations("ns") / await getTranslations("ns")
        ...[...src.matchAll(/(?:useTranslations|getTranslations)\(\s*["'`]([^"'`]+)["'`]\s*\)/g)].map((m) => m[1]),
        // t = await getTranslations({ locale, namespace: "ns" })  ← metadata pattern
        ...[...src.matchAll(/namespace:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]),
      ]
      if (namespaces.length === 0) continue
      // Static keys only — t(`x.${y}`) and t(someVar) are unverifiable here.
      for (const match of src.matchAll(/\bt\(\s*["'`]([A-Za-z0-9_.]+)["'`]/g)) {
        usages.push({ file: rel, namespaces, key: match[1] })
      }
    }
  }
  return usages
}

describe("i18n message keys", () => {
  const usages = collectUsages()

  it("finds translation usages to check", () => {
    expect(usages.length).toBeGreaterThan(100)
  })

  it("has both locales structurally in sync at the top level", () => {
    expect(Object.keys(es as Messages).sort()).toEqual(Object.keys(en as Messages).sort())
  })

  for (const [locale, messages] of [["en", en], ["es", es]] as const) {
    it(`resolves every t("key") used in the app (${locale})`, () => {
      const missing = usages
        .filter((u) => !u.namespaces.some((ns) => resolve(messages as Messages, `${ns}.${u.key}`) !== undefined))
        .map((u) => `${u.namespaces.join("|")}.${u.key}  (${u.file})`)
      expect([...new Set(missing)]).toEqual([])
    })
  }
})
