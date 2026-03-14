import * as THREE from 'three'

export class VoxelGrid {
  readonly resolution: number
  readonly min: THREE.Vector3
  readonly max: THREE.Vector3
  readonly cellSize: THREE.Vector3
  readonly solid: Uint8Array
  readonly totalVoxels: number

  constructor(boundingBox: THREE.Box3, resolution: number = 64) {
    this.resolution = resolution
    const padding = new THREE.Vector3(0.1, 0.1, 0.1)
    this.min = boundingBox.min.clone().sub(padding)
    this.max = boundingBox.max.clone().add(padding)
    const size = this.max.clone().sub(this.min)
    this.cellSize = size.divideScalar(resolution)
    this.totalVoxels = resolution * resolution * resolution
    this.solid = new Uint8Array(this.totalVoxels)
  }

  index(x: number, y: number, z: number): number {
    return x + y * this.resolution + z * this.resolution * this.resolution
  }

  fromIndex(idx: number): [number, number, number] {
    const z = Math.floor(idx / (this.resolution * this.resolution))
    const y = Math.floor((idx % (this.resolution * this.resolution)) / this.resolution)
    const x = idx % this.resolution
    return [x, y, z]
  }

  worldToVoxel(worldPos: THREE.Vector3): THREE.Vector3 {
    const local = worldPos.clone().sub(this.min)
    return new THREE.Vector3(
      Math.floor(local.x / this.cellSize.x),
      Math.floor(local.y / this.cellSize.y),
      Math.floor(local.z / this.cellSize.z)
    ).clamp(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(this.resolution - 1, this.resolution - 1, this.resolution - 1)
    )
  }

  voxelToWorld(voxelPos: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(
      this.min.x + (voxelPos.x + 0.5) * this.cellSize.x,
      this.min.y + (voxelPos.y + 0.5) * this.cellSize.y,
      this.min.z + (voxelPos.z + 0.5) * this.cellSize.z
    )
  }

  isSolid(idx: number): boolean {
    return this.solid[idx] === 1
  }

  markSolid(idx: number): void {
    if (idx >= 0 && idx < this.totalVoxels) {
      this.solid[idx] = 1
    }
  }

  getNeighbors(idx: number): number[] {
    const [x, y, z] = this.fromIndex(idx)
    const neighbors: number[] = []
    const offsets = [[-1,0,0],[1,0,0],[0,-1,0],[0,1,0],[0,0,-1],[0,0,1]]
    for (const [dx, dy, dz] of offsets) {
      const nx = x + dx, ny = y + dy, nz = z + dz
      if (nx >= 0 && nx < this.resolution && ny >= 0 && ny < this.resolution && nz >= 0 && nz < this.resolution) {
        neighbors.push(this.index(nx, ny, nz))
      }
    }
    return neighbors
  }

  voxelizeMesh(geometry: THREE.BufferGeometry, worldMatrix: THREE.Matrix4): void {
    // Bake worldMatrix into geometry so vertices are in world space.
    const tempGeo = geometry.clone()
    tempGeo.applyMatrix4(worldMatrix)

    // Step 1: Mark surface voxels (voxels containing mesh triangles)
    // This ensures vertices ON the surface are always in solid voxels.
    this.markSurfaceVoxels(tempGeo)

    // Step 2: Fill interior voxels via ray casting
    const raycaster = new THREE.Raycaster()
    // Use DoubleSide so raycasting works regardless of face winding
    const tempMesh = new THREE.Mesh(
      tempGeo,
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    )

    for (let z = 0; z < this.resolution; z++) {
      for (let y = 0; y < this.resolution; y++) {
        const worldPos = this.voxelToWorld(new THREE.Vector3(0, y, z))
        raycaster.set(
          new THREE.Vector3(this.min.x - 1, worldPos.y, worldPos.z),
          new THREE.Vector3(1, 0, 0)
        )

        const intersects = raycaster.intersectObject(tempMesh)

        let inside = false
        let prevX = 0
        for (const hit of intersects) {
          const vx = Math.floor((hit.point.x - this.min.x) / this.cellSize.x)
          const clampedVx = Math.max(0, Math.min(this.resolution - 1, vx))
          if (!inside) {
            // Entered mesh — mark entry surface voxel
            this.markSolid(this.index(clampedVx, y, z))
          } else {
            // Inside mesh — fill voxels from previous hit to current hit
            for (let x = Math.max(0, prevX); x < Math.min(this.resolution, vx + 1); x++) {
              this.solid[this.index(x, y, z)] = 1
            }
          }
          inside = !inside
          prevX = vx
        }
      }
    }
  }

  /** Mark voxels that contain mesh triangle vertices as solid */
  private markSurfaceVoxels(geometry: THREE.BufferGeometry): void {
    const position = geometry.getAttribute('position')
    if (!position) return

    const v = new THREE.Vector3()
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i)
      const voxelPos = this.worldToVoxel(v)
      const idx = this.index(voxelPos.x, voxelPos.y, voxelPos.z)
      this.markSolid(idx)
    }
  }

  getSolidCount(): number {
    let count = 0
    for (let i = 0; i < this.totalVoxels; i++) {
      if (this.solid[i]) count++
    }
    return count
  }
}
