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
import { AICoverLetterModule } from "./modules/AICoverLetterModule"
import { AIProfileModule } from "./modules/AIProfileModule"
import { AIMergeBulletsModule, type MergeBulletsInput, type MergeBulletsResult } from "./modules/AIMergeBulletsModule"
import { AISkillBulletModule } from "./modules/AISkillBulletModule"
import { AITranslateModule } from "./modules/AITranslateModule"
import { AIImportModule, type ImportExtractInput } from "./modules/AIImportModule"
import type { ResumeSections } from "@/types/resume"

import type {
  BulletResult,
  CoverLetterResult,
  FillProfileInput,
  FillProfileResult,
  GenerateCoverLetterInput,
  GenerateSummaryInput,
  ImproveBulletInput,
  ImproveCoverLetterInput,
  SkillBulletInput,
  SkillBulletResult,
  TranslateCVInput,
  TranslateCVResult,
  VersionsResult,
} from "./shared/ai-types"

// Re-export shared types so existing consumers keep working with current import paths.
export type {
  VersionsResult,
  BulletResult,
  CoverLetterResult,
  SkillItem,
  FillProfileResult,
  ImproveBulletInput,
  GenerateSummaryInput,
  ImproveSummaryInput,
  GenerateCoverLetterInput,
  ImproveCoverLetterInput,
  FillProfileInput,
  TranslateCVInput,
  TranslateCVResult,
} from "./shared/ai-types"

export class AIService {
  private readonly bulletModule: AIBulletModule
  private readonly summaryModule: AISummaryModule
  private readonly coverLetterModule: AICoverLetterModule
  private readonly profileModule: AIProfileModule
  private readonly skillBulletModule: AISkillBulletModule
  private readonly mergeBulletsModule: AIMergeBulletsModule
  private readonly translateModule: AITranslateModule
  private readonly importModule: AIImportModule

  constructor(aiClient: IAIClient, logger: ILogger) {
    this.bulletModule = new AIBulletModule(aiClient, logger)
    this.summaryModule = new AISummaryModule(aiClient, logger)
    this.coverLetterModule = new AICoverLetterModule(aiClient, logger)
    this.profileModule = new AIProfileModule(aiClient, logger)
    this.skillBulletModule = new AISkillBulletModule(aiClient, logger)
    this.mergeBulletsModule = new AIMergeBulletsModule(aiClient, logger)
    this.translateModule = new AITranslateModule(aiClient, logger)
    this.importModule = new AIImportModule(aiClient, logger)
  }

  /** AI-primary CV import: structured extraction from raw PDF/DOCX text.
   *  Returns null when the text is not a resume / the model failed — the caller
   *  then falls back to the deterministic heuristic parser (zero regression). */
  importResume(userId: string, input: ImportExtractInput, plan: string): Promise<ResumeSections | null> {
    return this.importModule.extractResume(userId, input, plan)
  }

  improveBullet(userId: string, input: ImproveBulletInput, plan: string): Promise<BulletResult> {
    return this.bulletModule.improveBullet(userId, input, plan)
  }

  generateSummary(userId: string, input: GenerateSummaryInput, plan: string): Promise<VersionsResult> {
    return this.summaryModule.generateSummary(userId, input, plan)
  }

  generateCoverLetter(userId: string, input: GenerateCoverLetterInput, plan: string): Promise<CoverLetterResult> {
    return this.coverLetterModule.generateCoverLetter(userId, input, plan)
  }

  improveCoverLetter(userId: string, input: ImproveCoverLetterInput, plan: string): Promise<VersionsResult> {
    return this.coverLetterModule.improveCoverLetter(userId, input, plan)
  }

  fillProfile(userId: string, input: FillProfileInput, plan: string): Promise<FillProfileResult> {
    return this.profileModule.fillProfile(userId, input, plan)
  }


  /** Weave a skill the candidate already has into one bullet of the best-fit job. */
  weaveSkillBullet(userId: string, input: SkillBulletInput, plan: string): Promise<SkillBulletResult> {
    return this.skillBulletModule.weaveSkillBullet(userId, input, plan)
  }

  /** Fuse two thin bullets of one role into a single solid line. Which two is
   *  decided deterministically before this is ever called. */
  mergeBullets(userId: string, input: MergeBulletsInput, plan: string): Promise<MergeBulletsResult> {
    return this.mergeBulletsModule.mergeBullets(userId, input, plan)
  }

  translateCV(userId: string, input: TranslateCVInput, plan: string): Promise<TranslateCVResult> {
    return this.translateModule.translateCV(userId, input, plan)
  }
}
