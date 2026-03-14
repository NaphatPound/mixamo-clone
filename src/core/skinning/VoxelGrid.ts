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
    const size = new THREE.Vector3()
    boundingBox.getSize(size)
    // Padding proportional to model size for better coverage
    const padding = size.clone().multiplyScalar(0.05).clampScalar(0.05, 0.5)
    this.min = boundingBox.min.clone().sub(padding)
    this.max = boundingBox.max.clone().add(padding)
    const gridSize = this.max.clone().sub(this.min)
    this.cellSize = gridSize.divideScalar(resolution)
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

  /** Returns fractional voxel coordinates for trilinear interpolation */
  worldToVoxelFrac(worldPos: THREE.Vector3): THREE.Vector3 {
    const local = worldPos.clone().sub(this.min)
    return new THREE.Vector3(
      local.x / this.cellSize.x - 0.5,
      local.y / this.cellSize.y - 0.5,
      local.z / this.cellSize.z - 0.5
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
    const tempGeo = geometry.clone()
    tempGeo.applyMatrix4(worldMatrix)

    // Step 1: Mark surface voxels from triangle vertices
    this.markSurfaceVoxels(tempGeo)

    // Step 2: Fill interior via ray casting along ALL 3 axes for robust coverage
    const raycaster = new THREE.Raycaster()
    const tempMesh = new THREE.Mesh(
      tempGeo,
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    )

    // Cast rays along X axis
    for (let z = 0; z < this.resolution; z++) {
      for (let y = 0; y < this.resolution; y++) {
        const wp = this.voxelToWorld(new THREE.Vector3(0, y, z))
        raycaster.set(new THREE.Vector3(this.min.x - 1, wp.y, wp.z), new THREE.Vector3(1, 0, 0))
        this.fillFromIntersects(raycaster.intersectObject(tempMesh), 'x', y, z)
      }
    }

    // Cast rays along Y axis
    for (let z = 0; z < this.resolution; z++) {
      for (let x = 0; x < this.resolution; x++) {
        const wp = this.voxelToWorld(new THREE.Vector3(x, 0, z))
        raycaster.set(new THREE.Vector3(wp.x, this.min.y - 1, wp.z), new THREE.Vector3(0, 1, 0))
        this.fillFromIntersects(raycaster.intersectObject(tempMesh), 'y', x, z)
      }
    }

    // Cast rays along Z axis
    for (let y = 0; y < this.resolution; y++) {
      for (let x = 0; x < this.resolution; x++) {
        const wp = this.voxelToWorld(new THREE.Vector3(x, y, 0))
        raycaster.set(new THREE.Vector3(wp.x, wp.y, this.min.z - 1), new THREE.Vector3(0, 0, 1))
        this.fillFromIntersects(raycaster.intersectObject(tempMesh), 'z', x, y)
      }
    }
  }

  private fillFromIntersects(
    intersects: THREE.Intersection[],
    axis: 'x' | 'y' | 'z',
    a: number, b: number
  ): void {
    let inside = false
    let prevV = 0

    for (const hit of intersects) {
      const coord = axis === 'x' ? hit.point.x : axis === 'y' ? hit.point.y : hit.point.z
      const minCoord = axis === 'x' ? this.min.x : axis === 'y' ? this.min.y : this.min.z
      const cellSize = axis === 'x' ? this.cellSize.x : axis === 'y' ? this.cellSize.y : this.cellSize.z

      const vv = Math.floor((coord - minCoord) / cellSize)
      const clampedVv = Math.max(0, Math.min(this.resolution - 1, vv))

      if (!inside) {
        // Mark entry surface voxel
        this.markSolidByAxis(axis, clampedVv, a, b)
      } else {
        // Fill interior
        for (let v = Math.max(0, prevV); v < Math.min(this.resolution, vv + 1); v++) {
          this.markSolidByAxis(axis, v, a, b)
        }
      }
      inside = !inside
      prevV = vv
    }
  }

  private markSolidByAxis(axis: 'x' | 'y' | 'z', v: number, a: number, b: number): void {
    let x: number, y: number, z: number
    if (axis === 'x') { x = v; y = a; z = b }
    else if (axis === 'y') { x = a; y = v; z = b }
    else { x = a; y = b; z = v }
    if (x >= 0 && x < this.resolution && y >= 0 && y < this.resolution && z >= 0 && z < this.resolution) {
      this.solid[this.index(x, y, z)] = 1
    }
  }

  private markSurfaceVoxels(geometry: THREE.BufferGeometry): void {
    const position = geometry.getAttribute('position')
    if (!position) return

    const index = geometry.getIndex()
    const v0 = new THREE.Vector3()
    const v1 = new THREE.Vector3()
    const v2 = new THREE.Vector3()

    // Mark triangle edges, not just vertices, for better surface coverage
    const triangleCount = index ? index.count / 3 : position.count / 3

    for (let t = 0; t < triangleCount; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2

      v0.fromBufferAttribute(position, i0)
      v1.fromBufferAttribute(position, i1)
      v2.fromBufferAttribute(position, i2)

      // Mark vertices
      this.markWorldPos(v0)
      this.markWorldPos(v1)
      this.markWorldPos(v2)

      // Mark edge midpoints for better coverage on large triangles
      this.markWorldPos(v0.clone().add(v1).multiplyScalar(0.5))
      this.markWorldPos(v0.clone().add(v2).multiplyScalar(0.5))
      this.markWorldPos(v1.clone().add(v2).multiplyScalar(0.5))

      // Mark triangle center
      this.markWorldPos(v0.clone().add(v1).add(v2).divideScalar(3))
    }
  }

  private markWorldPos(pos: THREE.Vector3): void {
    const vp = this.worldToVoxel(pos)
    this.markSolid(this.index(vp.x, vp.y, vp.z))
  }

  getSolidCount(): number {
    let count = 0
    for (let i = 0; i < this.totalVoxels; i++) {
      if (this.solid[i]) count++
    }
    return count
  }
}
