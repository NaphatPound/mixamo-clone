import * as THREE from 'three'
import type { SkinWeights } from './HeatDiffusion'
import { MAX_BONE_INFLUENCES } from '../../utils/constants'

export function bindSkin(
  mesh: THREE.Mesh,
  skeleton: THREE.Skeleton,
  skinWeights: SkinWeights
): THREE.SkinnedMesh {
  const geometry = mesh.geometry.clone()
  const material = Array.isArray(mesh.material)
    ? mesh.material.map((m) => m.clone())
    : mesh.material.clone()

  // Bake the mesh's world transform into the geometry so vertices are in
  // world space, matching the world-space bone positions from landmarks.
  // This keeps the SkinnedMesh itself at identity, avoiding issues with
  // bones being reparented under a transformed mesh.
  mesh.updateWorldMatrix(true, false)
  geometry.applyMatrix4(mesh.matrixWorld)

  // Set skin attributes
  const vertexCount = geometry.getAttribute('position').count

  const skinIndexAttr = new THREE.Uint16BufferAttribute(
    new Uint16Array(vertexCount * MAX_BONE_INFLUENCES),
    MAX_BONE_INFLUENCES
  )
  const skinWeightAttr = new THREE.Float32BufferAttribute(
    new Float32Array(vertexCount * MAX_BONE_INFLUENCES),
    MAX_BONE_INFLUENCES
  )

  for (let i = 0; i < vertexCount; i++) {
    const base = i * MAX_BONE_INFLUENCES
    for (let j = 0; j < MAX_BONE_INFLUENCES; j++) {
      skinIndexAttr.setComponent(i, j, skinWeights.indices[base + j])
      skinWeightAttr.setComponent(i, j, skinWeights.weights[base + j])
    }
  }

  geometry.setAttribute('skinIndex', skinIndexAttr)
  geometry.setAttribute('skinWeight', skinWeightAttr)

  const skinnedMesh = new THREE.SkinnedMesh(geometry, material)
  skinnedMesh.name = mesh.name || 'RiggedMesh'

  // Add skeleton
  const rootBone = skeleton.bones[0]
  skinnedMesh.add(rootBone)
  skinnedMesh.bind(skeleton)

  return skinnedMesh
}

export function createBindPoseMatrices(skeleton: THREE.Skeleton): THREE.Matrix4[] {
  return skeleton.bones.map((bone) => {
    const m = new THREE.Matrix4()
    bone.updateMatrixWorld(true)
    m.copy(bone.matrixWorld).invert()
    return m
  })
}
