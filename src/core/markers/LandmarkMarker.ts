import * as THREE from 'three'

export interface Landmark {
  key: string
  label: string
  position: THREE.Vector3
  normal: THREE.Vector3
  required: boolean
  color: string
}

export function createMarkerMesh(landmark: Landmark): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.02, 16, 16)
  const material = new THREE.MeshStandardMaterial({
    color: landmark.color,
    emissive: landmark.color,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.9,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(landmark.position)
  mesh.name = `marker_${landmark.key}`
  mesh.userData = { landmarkKey: landmark.key, isMarker: true }
  return mesh
}

export function updateMarkerPosition(
  mesh: THREE.Mesh,
  position: THREE.Vector3,
  normal: THREE.Vector3
): void {
  mesh.position.copy(position)
  mesh.lookAt(position.clone().add(normal))
}
