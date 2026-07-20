// lib/services/ai/AIService.ts
// Orchestrator: delegates each public method to a specialised module.
// All prompt logic, validation and AI calls live inside ./modules/*.
// Quota enforcement, JSON parsing helpers and cost logging live in ./shared/*.
//
// Public API is preserved 1:1 — callers in /app/api/ai/* and /lib/controllers/* remain unchanged.

import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

import { AIBulletModule } from "./modules/AIBulletModule"
import { AISummaryModule } from "./modules/AISummaryModule"
import { AIReviewModule } from "./modules/AIReviewModule"
import { AICoverLetterModule } from "./modules/AICoverLetterModule"
import { AIProfileModule } from "./modules/AIProfileModule"
import { AITailorModule } from "./modules/AITailorModule"

import type {
  ATSScoreInput,
  ATSScoreResult,
  ATSRescoreInput,
  BulletResult,
  CoverLetterResult,
  FillProfileInput,
  FillProfileResult,
  GenerateCoverLetterInput,
  GenerateSummaryInput,
  ImproveBulletInput,
  ImproveCoverLetterInput,
  ImproveSummaryInput,
  ReviewCVInput,
  ReviewResult,
  TailorCVInput,
  TailorCVResultV2,
  VersionsResult,
} from "./shared/ai-types"

// Re-export shared types so existing consumers keep working with current import paths.
export type {
  VersionsResult,
  BulletResult,
  ATSScoreResult,
  CoverLetterResult,
  SkillItem,
  ReviewResult,
  FillProfileResult,
  ImproveBulletInput,
  GenerateSummaryInput,
  ImproveSummaryInput,
  ATSScoreInput,
  ATSRescoreInput,
  GenerateCoverLetterInput,
  ImproveCoverLetterInput,
  ReviewCVInput,
  FillProfileInput,
  TailorCVInput,
  TailorCVResultV2,
} from "./shared/ai-types"

export class AIService {
  private readonly bulletModule: AIBulletModule
  private readonly summaryModule: AISummaryModule
  private readonly reviewModule: AIReviewModule
  private readonly coverLetterModule: AICoverLetterModule
  private readonly profileModule: AIProfileModule
  private readonly tailorModule: AITailorModule

  constructor(aiClient: IAIClient, logger: ILogger) {
    this.bulletModule = new AIBulletModule(aiClient, logger)
    this.summaryModule = new AISummaryModule(aiClient, logger)
    this.reviewModule = new AIReviewModule(aiClient, logger)
    this.coverLetterModule = new AICoverLetterModule(aiClient, logger)
    this.profileModule = new AIProfileModule(aiClient, logger)
    this.tailorModule = new AITailorModule(aiClient, logger)
  }

  improveBullet(userId: string, input: ImproveBulletInput, plan: string): Promise<BulletResult> {
    return this.bulletModule.improveBullet(userId, input, plan)
  }

  generateSummary(userId: string, input: GenerateSummaryInput, plan: string): Promise<VersionsResult> {
    return this.summaryModule.generateSummary(userId, input, plan)
  }

  improveSummary(userId: string, input: ImproveSummaryInput, plan: string): Promise<VersionsResult> {
    return this.summaryModule.improveSummary(userId, input, plan)
  }

  atsScore(userId: string, input: ATSScoreInput, plan: string): Promise<ATSScoreResult> {
    return this.reviewModule.atsScore(userId, input, plan)
  }

  /** Deterministic re-score (no LLM, no quota) — reuses keywords from a prior atsScore. */
  atsRescore(input: ATSRescoreInput): ATSScoreResult {
    return this.reviewModule.atsRescore(input)
  }

  generateCoverLetter(userId: string, input: GenerateCoverLetterInput, plan: string): Promise<CoverLetterResult> {
    return this.coverLetterModule.generateCoverLetter(userId, input, plan)
  }

  improveCoverLetter(userId: string, input: ImproveCoverLetterInput, plan: string): Promise<VersionsResult> {
    return this.coverLetterModule.improveCoverLetter(userId, input, plan)
  }

  reviewCV(userId: string, input: ReviewCVInput, plan: string): Promise<ReviewResult> {
    return this.reviewModule.reviewCV(userId, input, plan)
  }

  fillProfile(userId: string, input: FillProfileInput, plan: string): Promise<FillProfileResult> {
    return this.profileModule.fillProfile(userId, input, plan)
  }


  tailorCV(userId: string, input: TailorCVInput, plan: string): Promise<TailorCVResultV2> {
    return this.tailorModule.tailorCV(userId, input, plan)
  }
}
