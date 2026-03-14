import * as THREE from 'three'
import type { SkeletonTemplate } from '../skeleton/SkeletonTemplate'

export function generateBoneHierarchy(template: SkeletonTemplate): THREE.Bone {
  const boneMap = new Map<string, THREE.Bone>()

  for (const def of template.bones) {
    const bone = new THREE.Bone()
    bone.name = def.name
    bone.position.set(...def.defaultLocalPosition)
    boneMap.set(def.name, bone)

    if (def.parent && boneMap.has(def.parent)) {
      boneMap.get(def.parent)!.add(bone)
    }
  }

  const root = boneMap.get(template.bones[0].name)!
  root.updateMatrixWorld(true)
  return root
}

export function collectBones(root: THREE.Bone): THREE.Bone[] {
  const bones: THREE.Bone[] = []
  function traverse(bone: THREE.Bone) {
    bones.push(bone)
    for (const child of bone.children) {
      if (child instanceof THREE.Bone) traverse(child)
    }
  }
  traverse(root)
  return bones
}
