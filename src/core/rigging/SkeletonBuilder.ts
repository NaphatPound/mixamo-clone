import * as THREE from 'three'
import { collectBones } from './BoneGenerator'

export function buildSkeleton(rootBone: THREE.Bone): THREE.Skeleton {
  const bones = collectBones(rootBone)
  const skeleton = new THREE.Skeleton(bones)
  return skeleton
}

export function createSkeletonHelper(skeleton: THREE.Skeleton): THREE.SkeletonHelper {
  const rootBone = skeleton.bones[0]
  const helper = new THREE.SkeletonHelper(rootBone)
  return helper
}

export function getSkeletonInfo(skeleton: THREE.Skeleton): {
  boneCount: number
  maxDepth: number
  boneNames: string[]
} {
  const boneNames = skeleton.bones.map((b) => b.name)

  function getDepth(bone: THREE.Bone, depth: number): number {
    let maxDepth = depth
    for (const child of bone.children) {
      if (child instanceof THREE.Bone) {
        maxDepth = Math.max(maxDepth, getDepth(child, depth + 1))
      }
    }
    return maxDepth
  }

  const maxDepth = skeleton.bones.length > 0 ? getDepth(skeleton.bones[0], 0) : 0

  return { boneCount: skeleton.bones.length, maxDepth, boneNames }
}
