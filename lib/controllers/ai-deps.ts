// lib/controllers/ai-deps.ts
import { AIService } from "@/lib/services/ai/AIService"
import { AnthropicClientAdapter } from "@/lib/services/ai/AnthropicClientAdapter"
import { createLogger } from "@/lib/logger"

// Claude es la IA principal y OpenAI el respaldo (CEO, 2026-10-20). El adapter
// rutea por el nombre del modelo: un modelo `claude-*` va a Anthropic, cualquier
// otro va a OpenAI exactamente como antes. Qué ranura usa Claude lo deciden las
// env de `lib/ai-client.ts`, no este archivo.
const aiClient = new AnthropicClientAdapter()
const logger = createLogger("AIService")

export const aiService = new AIService(aiClient, logger)
