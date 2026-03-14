import * as THREE from 'three'
import type { SkeletonTemplate } from './SkeletonTemplate'

export function fitTemplateToBones(
  template: SkeletonTemplate,
  landmarks: Map<string, THREE.Vector3>
): THREE.Bone {
  const boneMap = new Map<string, THREE.Bone>()

  for (const def of template.bones) {
    const bone = new THREE.Bone()
    bone.name = def.name

    if (def.landmarkKey && landmarks.has(def.landmarkKey)) {
      const worldPos = landmarks.get(def.landmarkKey)!
      if (def.parent && boneMap.has(def.parent)) {
        const parent = boneMap.get(def.parent)!
        const parentWorldPos = new THREE.Vector3()
        parent.getWorldPosition(parentWorldPos)
        bone.position.copy(worldPos.clone().sub(parentWorldPos))
      } else {
        bone.position.copy(worldPos)
      }
    } else {
      bone.position.set(...def.defaultLocalPosition)
    }

    if (def.parent && boneMap.has(def.parent)) {
      boneMap.get(def.parent)!.add(bone)
    }
    boneMap.set(def.name, bone)
  }

  const root = boneMap.get(template.bones[0].name)!
  root.updateMatrixWorld(true)
  return root
}

export function validateSkeleton(rootBone: THREE.Bone): string[] {
  const errors: string[] = []
  const visited = new Set<string>()

  function traverse(bone: THREE.Bone, depth: number) {
    if (visited.has(bone.name)) {
      errors.push(`Duplicate bone name: ${bone.name}`)
      return
    }
    visited.add(bone.name)

    if (depth > 50) {
      errors.push(`Bone hierarchy too deep at: ${bone.name}`)
      return
    }

    const length = bone.position.length()
    if (length > 10) {
      errors.push(`Bone "${bone.name}" has unusually large offset: ${length.toFixed(2)}`)
    }

    for (const child of bone.children) {
      if (child instanceof THREE.Bone) {
        traverse(child, depth + 1)
      }
    }
  }

  traverse(rootBone, 0)
  return errors
}
