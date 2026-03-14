import * as THREE from 'three'

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerpVectors(a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 {
  return new THREE.Vector3().lerpVectors(a, b, t)
}

export function computeBoundingBox(geometry: THREE.BufferGeometry): THREE.Box3 {
  geometry.computeBoundingBox()
  return geometry.boundingBox!.clone()
}

export function computeCenter(box: THREE.Box3): THREE.Vector3 {
  const center = new THREE.Vector3()
  box.getCenter(center)
  return center
}

export function computeSize(box: THREE.Box3): THREE.Vector3 {
  const size = new THREE.Vector3()
  box.getSize(size)
  return size
}

export function normalizeToUnit(object: THREE.Object3D): number {
  const box = new THREE.Box3().setFromObject(object)
  const size = computeSize(box)
  const maxDim = Math.max(size.x, size.y, size.z)
  const scale = maxDim > 0 ? 1 / maxDim : 1
  return scale
}

export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}
