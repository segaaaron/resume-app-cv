// lib/controllers/ai-deps.ts
import { AIService } from "@/lib/services/ai/AIService"
import { OpenAIClientAdapter } from "@/lib/services/ai/OpenAIClientAdapter"
import { createLogger } from "@/lib/logger"

const aiClient = new OpenAIClientAdapter()
const logger = createLogger("AIService")

export const aiService = new AIService(aiClient, logger)
