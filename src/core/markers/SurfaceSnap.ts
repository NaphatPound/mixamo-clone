import * as THREE from 'three'

export function snapToSurface(
  raycaster: THREE.Raycaster,
  meshes: THREE.Mesh[],
  camera: THREE.Camera,
  screenPosition: THREE.Vector2
): { position: THREE.Vector3; normal: THREE.Vector3; face: THREE.Face | null } | null {
  raycaster.setFromCamera(screenPosition, camera)
  const intersections = raycaster.intersectObjects(meshes, true)

  if (intersections.length === 0) return null

  const hit = intersections[0]
  return {
    position: hit.point.clone(),
    normal: hit.face?.normal.clone() ?? new THREE.Vector3(0, 1, 0),
    face: hit.face ?? null,
  }
}

export function projectToSurface(
  point: THREE.Vector3,
  meshes: THREE.Mesh[],
  direction?: THREE.Vector3
): THREE.Vector3 | null {
  const raycaster = new THREE.Raycaster()
  const dir = direction ?? new THREE.Vector3(0, -1, 0)
  raycaster.set(point.clone().add(dir.clone().multiplyScalar(-10)), dir)

  const intersections = raycaster.intersectObjects(meshes, true)
  if (intersections.length === 0) return null

  return intersections[0].point.clone()
}
