import type { SkeletonTemplate, BoneDefinition, LandmarkDefinition } from './SkeletonTemplate'

export function createCustomTemplate(
  name: string,
  bones: BoneDefinition[],
  requiredLandmarks: LandmarkDefinition[]
): SkeletonTemplate {
  return {
    id: `custom_${Date.now()}`,
    name,
    type: 'custom',
    bones,
    requiredLandmarks,
    optionalLandmarks: [],
    testAnimations: ['bendTest'],
  }
}

export function addBoneToTemplate(
  template: SkeletonTemplate,
  bone: BoneDefinition
): SkeletonTemplate {
  return {
    ...template,
    bones: [...template.bones, bone],
  }
}

export function removeBoneFromTemplate(
  template: SkeletonTemplate,
  boneName: string
): SkeletonTemplate {
  const filtered = template.bones.filter(
    (b) => b.name !== boneName && b.parent !== boneName
  )
  return {
    ...template,
    bones: filtered,
  }
}
