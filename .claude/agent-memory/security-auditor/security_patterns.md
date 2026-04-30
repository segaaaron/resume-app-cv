---
name: Project Security Patterns
description: Recurring security conventions and architectural decisions for ReadyCV
type: project
---

# Security Conventions — ReadyCV

## Pro Gate Pattern
All AI endpoints check: `plan === "PRO" && subscriptionStatus === "ACTIVE" && (!subscriptionEndsAt || subscriptionEndsAt > now)` server-side after a fresh DB query. Do NOT trust session claims alone.

## Ownership Check Pattern
All resource endpoints (resumes, cover-letters, applications, versions) use `findFirst({ where: { id, userId: session.user.id } })` — never find by id alone.

## Rate Limiting (DB-based, migrated)
`checkRateLimit(userId, endpoint)` in `lib/ai-client.ts` uses `AIRateLimit` table. This replaced the old in-memory IP-based limiter. Still in-memory in two places: `app/api/auth/register/route.ts` and `app/api/resumes/share/route.ts`.

## Stripe Webhook
`stripe.webhooks.constructEvent()` + idempotency via `StripeEvent` table with P2002 guard at top of handler. Valid.

## CSRF
`checkOrigin()` from `lib/csrf.ts` applied to: DELETE /user/delete, Stripe cancel, refund. PATCH /user/profile does NOT have it — low risk since it only updates name.

## AI Input Validation
`validateAIInput(text, maxLength)` returns `{ valid, error }`. Endpoints only block on `injection_detected`, NOT on `too_long` (by design in most — some are correct). This was flagged as M14 debt.

## Data Export
`GET /api/user/data-export` — missing: applications, referrals, audit logs. No rate limit. Flagged as L8 (GDPR), L6 (rate limit) debt.

## Unsubscribe Endpoint
`GET /api/user/unsubscribe?email=` — does NOT persist opt-out to DB. Accepts any email parameter without auth (enumeration risk low since it gives no info). TODO in code.

## photoUrl Validation
Regex in `app/api/resumes/[id]/route.ts` patchSchema: `/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/` with `.max(500000)`. Magic-byte check in `app/api/resumes/[id]/photo/route.ts`.

## PDF Import
`pdf-parse` used without timeout wrapper — DoS risk with malformed PDFs (L5 debt, still unresolved).

## Known Technical Debt (in priority order)
1. pdf-parse without timeout — DoS with crafted PDF (HIGH)
2. GDPR data export missing applications/referrals/audit logs (MEDIUM)
3. No rate limit on data-export endpoint (MEDIUM)
4. AI `too_long` validation ignored in most endpoints (LOW-MEDIUM)
5. In-memory rate limiter still in register and share routes (LOW)
6. Unsubscribe endpoint does not persist opt-out (LOW)
7. `PAST_DUE` users retain Pro access indefinitely (MEDIUM — business risk)
