export type MappingConfidence = "high" | "medium" | "low"

export type CompatibilityEntry = {
  previousExtensionId: string
  currentExtensionId: string
  previousSourceDomain?: string
  currentCanonicalDomain?: string
  previousTitleUrl?: string
  currentTitleUrl?: string
  previousChapterUrl?: string
  currentChapterUrl?: string
  mappingConfidence: MappingConfidence
  reason: string
  evidence?: string
  requiresUserConfirmation?: boolean
}
