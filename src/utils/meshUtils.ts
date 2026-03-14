import * as THREE from 'three'

export function extractGeometries(object: THREE.Object3D): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = []
  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      geometries.push(child.geometry)
    }
  })
  return geometries
}

export function mergeModelBounds(object: THREE.Object3D): THREE.Box3 {
  return new THREE.Box3().setFromObject(object)
}

export function centerObject(object: THREE.Object3D): void {
  const box = mergeModelBounds(object)
  const center = new THREE.Vector3()
  box.getCenter(center)
  object.position.sub(center)
  // Put on ground plane
  const newBox = mergeModelBounds(object)
  object.position.y -= newBox.min.y
}

export function normalizeScale(object: THREE.Object3D, targetSize: number = 2): void {
  const box = mergeModelBounds(object)
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z)
  if (maxDim > 0) {
    const scale = targetSize / maxDim
    object.scale.multiplyScalar(scale)
  }
}

export function getVertexPositions(geometry: THREE.BufferGeometry): THREE.Vector3[] {
  const positions = geometry.getAttribute('position')
  const vertices: THREE.Vector3[] = []
  for (let i = 0; i < positions.count; i++) {
    vertices.push(new THREE.Vector3().fromBufferAttribute(positions, i))
  }
  return vertices
}

export function computeVertexNormals(geometry: THREE.BufferGeometry): void {
  if (!geometry.getAttribute('normal')) {
    geometry.computeVertexNormals()
  }
}
