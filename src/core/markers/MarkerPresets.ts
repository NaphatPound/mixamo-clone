import type { LandmarkDefinition } from '../skeleton/SkeletonTemplate'

export interface MarkerPreset {
  templateType: string
  required: LandmarkDefinition[]
  optional: LandmarkDefinition[]
}

export function getMarkerPreset(templateId: string, requiredLandmarks: LandmarkDefinition[], optionalLandmarks: LandmarkDefinition[]): MarkerPreset {
  return {
    templateType: templateId,
    required: requiredLandmarks,
    optional: optionalLandmarks,
  }
}

export function getPlacementProgress(
  required: LandmarkDefinition[],
  placed: Set<string>
): { total: number; placed: number; percentage: number } {
  const total = required.length
  const placedCount = required.filter((l) => placed.has(l.key)).length
  return {
    total,
    placed: placedCount,
    percentage: total > 0 ? (placedCount / total) * 100 : 0,
  }
}
