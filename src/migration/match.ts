import type { CompatibilityEntry } from "./types"

export type MatchResult =
  | { status: "exact"; entry: CompatibilityEntry }
  | { status: "ambiguous"; candidates: CompatibilityEntry[] }
  | { status: "none" }

export function matchByExtensionId(
  entries: CompatibilityEntry[],
  previousExtensionId: string,
): MatchResult {
  const hits = entries.filter((entry) => entry.previousExtensionId === previousExtensionId)
  if (hits.length === 1) {
    const [entry] = hits
    if (entry) return { status: "exact", entry }
  }
  if (hits.length > 1) return { status: "ambiguous", candidates: hits }
  return { status: "none" }
}

export function titlesLookSimilar(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function refuseNameOnlyMerge(leftTitle: string, rightTitle: string, sameId: boolean): boolean {
  if (sameId) return false
  return titlesLookSimilar(leftTitle, rightTitle)
}
