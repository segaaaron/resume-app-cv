---
name: Estado del roadmap abril 2026
description: Estado real de completitud del roadmap y decisiones de producto tomadas a abril 2026
type: project
---

Estado auditado del roadmap a 2026-04-27.

**Why:** Registrar decisiones definitivas para no re-debatir en futuras sesiones.

**How to apply:** Usar como baseline al evaluar nuevas features o prioridades. No proponer features del mes 4 (Tracker).

## Decisiones definitivas

- **Tracker de candidaturas (Mes 4): CANCELADO.** El cliente decidio excluirlo del producto. No existe plan gratuito. No hay seguimiento de candidaturas. No proponer ni relacionar features con este modulo.
- **Empresa legal:** MS Saravia Tech Stack LLC
- **Modelo:** Solo plan Pro ($15/mes, $144/año). Sin plan gratuito.

## Estado por mes

| Mes | Tema | Estado |
|-----|------|--------|
| 1 | Editor solido | Completo |
| 2 | Exportacion premium | Completo |
| 3 | ATS Score | Parcial — falta sugerencia de habilidades por rol/industria |
| 4 | Tracker | CANCELADO |
| 5 | Carta de presentacion IA | Completo |
| 6 | Viralidad | Parcial — falta programa de referidos |

## Compliance implementado (abril 2026)

- T&C, Privacy Policy, Cookie Policy, DMCA
- Checkbox consentimiento en registro
- Rate limiting endpoints IA
- Filtro prompt injection
- DELETE cuenta (GDPR Art. 17)
- GDPR data export (Art. 20)
- Unsubscribe emails + footer
- security.txt
- Estado PAST_DUE con gracia de 3 dias

## Pendientes compliance por prioridad legal

1. ~~Stripe refund handler~~ ✅ en webhook
2. ~~Cron borrado datos 90d post-cancelacion~~ ✅ configurado en Dokploy
3. Age gate (16+) — pendiente decision del cliente
4. Audit log Prisma — compliance interno, no urgente

## Pendientes infra bloqueantes

- OPENAI_API_KEY en Dokploy — sin esto toda la IA esta caida en produccion
- Cron renewal-reminder en Dokploy — sin esto no hay recordatorios de renovacion

## Backlog priorizado (Must Have inmediato)

1. Configurar infra Dokploy (0 SP, desbloquea revenue de IA)
2. Stripe refund handler (3 SP)
3. Cron GDPR en Dokploy (1 SP)
4. PDF watermark en no-Pro (3 SP)
5. Sugerencia de habilidades por rol (5 SP)
6. Dashboard metricas CV publico — vistas (5 SP)
