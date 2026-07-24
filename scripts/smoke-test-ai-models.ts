/**
 * Live canary for the GPT-5.4 migration — the one thing that CANNOT be verified
 * without a real API call. Sends the EXACT request shape our modules use (through
 * the same normalizeParamsForModel the production adapter applies) to each model
 * and checks:
 *   1. No 400 — the reasoning-model contract (max_completion_tokens, no
 *      temperature, reasoning_effort) is accepted.
 *   2. response_format json_object still returns parseable JSON.
 *   3. Reasoning-token usage is visible (cost impact of reasoning_effort).
 *   4. Prose variety — 3 summary generations printed side by side so you can
 *      eyeball whether losing the temperature knob hurt diversity (MAJOR-2).
 *
 * RUN against staging/prod key BEFORE flipping AI_MODEL off the gpt-4.1 pin:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/smoke-test-ai-models.ts
 *
 * Exit 0 = contract OK, safe to activate GPT-5.4. Exit 1 = do NOT flip.
 */
import OpenAI from "openai"
import { normalizeParamsForModel } from "../lib/services/ai/shared/model-params"
import type { ChatParams } from "../lib/interfaces/IAIClient"

const NANO = process.env.AI_MODEL ?? "gpt-5.4-nano"
const MINI = process.env.AI_MODEL_PROSE ?? "gpt-5.4-mini"

function client(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    console.error("✖ OPENAI_API_KEY must be set.")
    process.exit(1)
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60_000, maxRetries: 2 })
}

/** Mirror a production module call: classic shape → normalize → send. */
async function callLikeProduction(openai: OpenAI, model: string, system: string, user: string): Promise<string> {
  const params = {
    model,
    max_tokens: 500,
    temperature: 0.6, // stripped by normalize for GPT-5 — proves the contract
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  } as ChatParams

  const res = await openai.chat.completions.create(normalizeParamsForModel(params))
  const usage = res.usage as (typeof res.usage & { completion_tokens_details?: { reasoning_tokens?: number } }) | undefined
  const reasoning = usage?.completion_tokens_details?.reasoning_tokens ?? 0
  console.log(
    `    usage: prompt=${usage?.prompt_tokens ?? 0} completion=${usage?.completion_tokens ?? 0} (reasoning=${reasoning})`,
  )
  return res.choices[0]?.message?.content ?? ""
}

async function checkContract(openai: OpenAI, model: string): Promise<boolean> {
  console.log(`\n▶ ${model} — contract check (json_object + max_completion_tokens + no temperature)`)
  try {
    const out = await callLikeProduction(
      openai,
      model,
      "You output ONLY valid JSON.",
      'Return {"ok": true, "model_role": "<one word>"} and nothing else.',
    )
    const parsed = JSON.parse(out)
    if (parsed.ok !== true) throw new Error(`unexpected JSON: ${out.slice(0, 120)}`)
    console.log(`    ✓ accepted request + returned valid JSON`)
    return true
  } catch (err) {
    console.error(`    ✖ FAILED: ${err instanceof Error ? err.message : String(err)}`)
    return false
  }
}

async function checkVariety(openai: OpenAI): Promise<void> {
  console.log(`\n▶ ${MINI} — prose variety (3 runs, no temperature knob) — eyeball diversity:`)
  const sys = "You are a resume writer. Output ONLY JSON: {\"summary\":\"...\"}."
  const usr = 'Write a 1-sentence professional summary for an iOS developer with 7 years experience. Vary the phrasing each time.'
  for (let i = 1; i <= 3; i++) {
    try {
      const out = await callLikeProduction(openai, MINI, sys, usr)
      const s = JSON.parse(out).summary ?? out
      console.log(`    [${i}] ${String(s).slice(0, 160)}`)
    } catch (err) {
      console.log(`    [${i}] ✖ ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}

async function main(): Promise<void> {
  const openai = client()
  console.log(`Canary: baseline=${NANO} · prose=${MINI} · effort=${process.env.AI_REASONING_EFFORT ?? "low"}`)

  const nanoOk = await checkContract(openai, NANO)
  const miniOk = await checkContract(openai, MINI)
  await checkVariety(openai)

  console.log(`\n▶ Result: ${NANO}=${nanoOk ? "OK" : "FAIL"} · ${MINI}=${miniOk ? "OK" : "FAIL"}`)
  if (!nanoOk || !miniOk) {
    console.error("✖ Contract failed — do NOT flip off the gpt-4.1 pin. Keep rollback env set.")
    process.exit(1)
  }
  console.log("✓ Contract OK. Review the variety samples above, then activate GPT-5.4.")
}

main().catch((err) => {
  console.error("✖ Fatal:", err instanceof Error ? err.message : err)
  process.exit(1)
})
