import * as THREE from 'three'
import type { SkeletonTemplate } from '../skeleton/SkeletonTemplate'

export function fitBonesToLandmarks(
  rootBone: THREE.Bone,
  template: SkeletonTemplate,
  landmarks: Map<string, THREE.Vector3>
): void {
  const boneMap = new Map<string, THREE.Bone>()

  function collectBones(bone: THREE.Bone) {
    boneMap.set(bone.name, bone)
    for (const child of bone.children) {
      if (child instanceof THREE.Bone) collectBones(child)
    }
  }
  collectBones(rootBone)

  for (const def of template.bones) {
    if (!def.landmarkKey || !landmarks.has(def.landmarkKey)) continue

    const bone = boneMap.get(def.name)
    if (!bone) continue

    const targetWorld = landmarks.get(def.landmarkKey)!

    if (bone.parent instanceof THREE.Bone) {
      const parentWorld = new THREE.Vector3()
      bone.parent.getWorldPosition(parentWorld)
      const parentInverse = new THREE.Matrix4()
      parentInverse.copy(bone.parent.matrixWorld).invert()
      const localPos = targetWorld.clone().applyMatrix4(parentInverse)
      bone.position.copy(localPos)
    } else {
      bone.position.copy(targetWorld)
    }
  }

  rootBone.updateMatrixWorld(true)
}
