// lib/controllers/referral-deps.ts
import { ReferralService } from "@/lib/services/referral/ReferralService"
import { createLogger } from "@/lib/logger"

export const referralService = new ReferralService(createLogger("ReferralService"))
