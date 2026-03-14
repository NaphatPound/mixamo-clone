import * as THREE from 'three'
import { centerObject, normalizeScale, mergeModelBounds } from '../../utils/meshUtils'

export interface MeshAnalysis {
  vertexCount: number
  faceCount: number
  boundingBox: THREE.Box3
  center: THREE.Vector3
  size: THREE.Vector3
  meshCount: number
}

export function analyzeModel(model: THREE.Object3D): MeshAnalysis {
  let vertexCount = 0
  let faceCount = 0
  let meshCount = 0

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geo = child.geometry
      vertexCount += geo.getAttribute('position')?.count ?? 0
      faceCount += geo.index ? geo.index.count / 3 : (geo.getAttribute('position')?.count ?? 0) / 3
      meshCount++
    }
  })

  const boundingBox = mergeModelBounds(model)
  const center = new THREE.Vector3()
  boundingBox.getCenter(center)
  const size = new THREE.Vector3()
  boundingBox.getSize(size)

  return { vertexCount, faceCount, boundingBox, center, size, meshCount }
}

export function prepareModel(model: THREE.Object3D): MeshAnalysis {
  centerObject(model)
  normalizeScale(model, 2)
  model.updateMatrixWorld(true)
  return analyzeModel(model)
}
