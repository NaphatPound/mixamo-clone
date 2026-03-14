import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { VoxelGrid } from '../core/skinning/VoxelGrid'

describe('VoxelGrid', () => {
  const bbox = new THREE.Box3(
    new THREE.Vector3(-1, -1, -1),
    new THREE.Vector3(1, 1, 1)
  )

  it('creates grid with correct resolution', () => {
    const grid = new VoxelGrid(bbox, 8)
    expect(grid.resolution).toBe(8)
    expect(grid.totalVoxels).toBe(8 * 8 * 8)
  })

  it('converts between index and coordinates', () => {
    const grid = new VoxelGrid(bbox, 8)
    const idx = grid.index(3, 4, 5)
    const [x, y, z] = grid.fromIndex(idx)
    expect(x).toBe(3)
    expect(y).toBe(4)
    expect(z).toBe(5)
  })

  it('world to voxel conversion clamps to valid range', () => {
    const grid = new VoxelGrid(bbox, 8)
    const voxel = grid.worldToVoxel(new THREE.Vector3(100, 100, 100))
    expect(voxel.x).toBeLessThan(grid.resolution)
    expect(voxel.y).toBeLessThan(grid.resolution)
    expect(voxel.z).toBeLessThan(grid.resolution)
  })

  it('voxel to world returns center of voxel cell', () => {
    const grid = new VoxelGrid(bbox, 8)
    const world = grid.voxelToWorld(new THREE.Vector3(0, 0, 0))
    expect(world.x).toBeDefined()
    expect(world.y).toBeDefined()
    expect(world.z).toBeDefined()
  })

  it('starts with no solid voxels', () => {
    const grid = new VoxelGrid(bbox, 8)
    expect(grid.getSolidCount()).toBe(0)
  })

  it('can mark voxels as solid', () => {
    const grid = new VoxelGrid(bbox, 8)
    grid.solid[grid.index(1, 1, 1)] = 1
    expect(grid.isSolid(grid.index(1, 1, 1))).toBe(true)
    expect(grid.getSolidCount()).toBe(1)
  })

  it('returns 6-connected neighbors for interior voxels', () => {
    const grid = new VoxelGrid(bbox, 8)
    const idx = grid.index(4, 4, 4) // interior voxel
    const neighbors = grid.getNeighbors(idx)
    expect(neighbors.length).toBe(6)
  })

  it('returns fewer neighbors for corner voxels', () => {
    const grid = new VoxelGrid(bbox, 8)
    const idx = grid.index(0, 0, 0) // corner
    const neighbors = grid.getNeighbors(idx)
    expect(neighbors.length).toBe(3) // only +x, +y, +z
  })
})
