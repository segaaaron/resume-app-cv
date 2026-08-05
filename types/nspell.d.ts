// nspell ships no types. Only the two methods the spell-checker uses are
// declared — a fuller surface would be guessing at an API we never call.
declare module "nspell" {
  interface NSpell {
    correct(word: string): boolean
    suggest(word: string): string[]
  }
  export default function nspell(dictionary: unknown): NSpell
}
