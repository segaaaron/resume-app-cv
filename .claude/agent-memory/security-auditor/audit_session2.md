---
name: Audit Session 2 — 2026-04-29
description: Second security audit findings: pending items, new vulnerabilities, dependency CVEs
type: project
---

# Audit Session 2 Findings (2026-04-29)

## Already resolved (do not re-flag)
- CSRF origin check on cancel/refund/delete
- Stripe webhook idempotency atomic P2002 guard
- Cover letter AI HTML escapeHtml()
- Photo magic-byte validation + photoUrl regex
- Refund window anchored to lastCharge.created
- ReferralConversion ledger P2002 idempotency + emailVerified guard
- deletedAt blocks login in lib/auth.ts
- Dead rate-limiter removed from proxy.ts
- AI rate limiter migrated to DB (checkRateLimit uses AIRateLimit table)

## Pending / New Findings (this session)

### HIGH — pdf-parse DoS (L5, still unresolved)
`app/api/resumes/import/route.ts` line 52: `await pdfParse(buffer)` — no timeout. Malformed PDF can hang the request forever. Fix: wrap in `Promise.race([pdfParse(buffer), timeout(10_000)])`.

### MEDIUM — GDPR data export incomplete (L8, still unresolved)
`app/api/user/data-export/route.ts` exports resumes + cover letters but NOT: applications (Kanban), referral data, audit log. GDPR Art. 20 requires all personal data.

### MEDIUM — Data export no rate limit (L6, still unresolved)
`GET /api/user/data-export` — no rate limit. A script could call it in a loop. Fix: add checkRateLimit or simple in-memory limit (1 export per 60 min per userId).

### MEDIUM — PAST_DUE users retain full Pro access indefinitely
`invoice.payment_failed` sets `subscriptionStatus = "PAST_DUE"` but the Pro gate in ALL AI endpoints checks only `subscriptionStatus === "ACTIVE"`. PAST_DUE is not ACTIVE, so they lose access correctly. BUT `cover-letter-docx/route.ts` uses `isActive()` from lib/plans.ts which returns `subscriptionStatus === "ACTIVE"` — PAST_DUE = blocked. No issue.
Wait — actually reviewed: all AI route gates use `=== "ACTIVE"`. `export/docx/route.ts` also checks `=== "ACTIVE"`. So PAST_DUE users lose AI access immediately. This is correct. Mark resolved / no issue.

### MEDIUM — AI too_long validation ignored (M14, still unresolved)
`validateAIInput` returns `{ valid: false, error: "too_long" }` when input exceeds maxLength. But `ats-score`, `improve-bullet`, `improve-cover-letter`, `review-cv`, `fill-profile` only block if `error === "injection_detected"`. A user who sends 3000-char text to a 2000-limit endpoint will have it passed through (truncation already happens for job description, but NOT for other fields like `body` in improve-cover-letter or `question` in review-cv).
Actually for improve-cover-letter: validates `body` to 3000 chars max but only blocks injection. The `validateAIInput(body, 3000)` — if body > 3000 chars, `valid: false, error: "too_long"` is returned but NOT acted upon (only injection_detected is blocked). The input goes to the model regardless, which is a minor waste but body is already bounded by the regex/Zod... Actually no, `body` has no max in the JSON parsing. This means users can send very large cover letter bodies. They'll be truncated by max_tokens anyway but it wastes input tokens.
For review-cv `question` is validated to 300 chars: `validateAIInput(String(question), 300)` — same issue, only injection blocked.

### LOW — Content-Disposition header injection in docx export
`app/api/export/docx/route.ts` line 235: `` `attachment; filename="${filename}"` `` where `filename` is derived from `resume.title.replace(/[^a-z0-9]/gi, "_")`. The regex is safe — non-alphanumeric chars are replaced with underscores. No injection possible. Mark safe.

### LOW — In-memory rate limiter in register route
`app/api/auth/register/route.ts` uses in-memory map. Resets on deploy, bypassable with multiple IPs. Acceptable for registration (low abuse potential with bcrypt cost of 12).

### LOW — In-memory rate limiter in share route
`app/api/resumes/share/route.ts` uses in-memory IP-based limiter. Same risk as above. Low severity since the endpoint requires auth.

### LOW — unsubscribe opt-out not persisted
`app/api/user/unsubscribe/route.ts` shows success page but does NOT write to DB. Users who click unsubscribe will keep receiving emails. GDPR compliance risk (CAN-SPAM / CASL too).

### LOW — cover-letters PATCH leaks validation details
`app/api/cover-letters/[id]/route.ts` line 53: returns `{ error: "Invalid data", details: parsed.error.issues }` — exposes Zod validation detail to client. Low risk for an authenticated endpoint (only leaks schema structure).

### INFO — @xmldom/xmldom HIGH CVE (transitive via docx package)
`docx` package depends on `@xmldom/xmldom < 0.8.13`. Three HIGH CVEs: XML injection, uncontrolled recursion DoS. The `docx` package uses xmldom internally for DOCX generation. The attack surface is limited (only Pro users trigger DOCX generation, input is from trusted DB data passed through Zod). Risk: LOW in practice, but upgrade `docx` to a version that pins xmldom >= 0.8.13 when available.

### INFO — postcss XSS (transitive via next)
`next@16.2.3` depends on `postcss < 8.5.10`. XSS via unescaped `</style>` in CSS stringify output. Only affects SSR CSS injection scenarios. Not exploitable in this app's architecture. Monitor for Next.js patch.

### INFO — @anthropic-ai/sdk MODERATE CVE
GHSA-p7fg-763f-g4gf: insecure default file permissions in local filesystem memory tool. This app does not use the Anthropic SDK (uses OpenAI SDK). The `@anthropic-ai/sdk` is installed but unused. No exploitable surface. Remove if unused to shrink attack surface.

### INFO — Checkout session planInterval fallback
`app/api/stripe/webhook/route.ts` line 50: if `priceId` is not monthly or annual, `planInterval` defaults to `"monthly"`. A valid webhook with unknown priceId would set a monthly plan. This can only occur if Stripe sends a checkout for an unrecognized price, which is unlikely with proper Stripe config. Minor business logic note.
