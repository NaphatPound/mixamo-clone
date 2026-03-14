import * as THREE from 'three'
import { VoxelGrid } from './VoxelGrid'
import { HEAT_DIFFUSION_ITERATIONS, MAX_BONE_INFLUENCES, WEIGHT_THRESHOLD } from '../../utils/constants'

export interface SkinWeights {
  indices: Uint16Array  // 4 bone indices per vertex
  weights: Float32Array // 4 weights per vertex
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Seed heat along entire bone segments (not just endpoints) for much
 * better weight distribution. Each bone is a segment from itself to
 * its parent; we walk along the segment and seed heat at every voxel.
 */
function seedBoneSegments(
  voxelGrid: VoxelGrid,
  bones: THREE.Bone[],
  weights: Float32Array[],
  boneVoxelIndices: number[]
): void {
  for (let b = 0; b < bones.length; b++) {
    const bone = bones[b]
    const boneWorldPos = new THREE.Vector3()
    bone.getWorldPosition(boneWorldPos)

    // Seed at bone position
    const vp = voxelGrid.worldToVoxel(boneWorldPos)
    const idx = voxelGrid.index(vp.x, vp.y, vp.z)
    boneVoxelIndices.push(idx)
    seedVoxelAndNeighbors(voxelGrid, weights[b], idx)

    // Seed along segment to parent
    if (bone.parent && bone.parent instanceof THREE.Bone) {
      const parentWorldPos = new THREE.Vector3()
      bone.parent.getWorldPosition(parentWorldPos)

      // Walk along the segment, seeding at regular intervals
      const segLen = boneWorldPos.distanceTo(parentWorldPos)
      const cellMin = Math.min(voxelGrid.cellSize.x, voxelGrid.cellSize.y, voxelGrid.cellSize.z)
      const steps = Math.max(2, Math.ceil(segLen / (cellMin * 0.5)))

      for (let s = 1; s < steps; s++) {
        const t = s / steps
        const p = boneWorldPos.clone().lerp(parentWorldPos, t)
        const svp = voxelGrid.worldToVoxel(p)
        const sidx = voxelGrid.index(svp.x, svp.y, svp.z)
        // Stronger heat near bone endpoint, weaker toward parent
        const heat = 1.0 - t * 0.5
        if (sidx >= 0 && sidx < voxelGrid.totalVoxels) {
          weights[b][sidx] = Math.max(weights[b][sidx], heat)
          voxelGrid.markSolid(sidx)
        }
      }
    }

    // Also seed along segment to each bone child
    for (const child of bone.children) {
      if (!(child instanceof THREE.Bone)) continue
      const childWorldPos = new THREE.Vector3()
      child.getWorldPosition(childWorldPos)
      const segLen = boneWorldPos.distanceTo(childWorldPos)
      const cellMin = Math.min(voxelGrid.cellSize.x, voxelGrid.cellSize.y, voxelGrid.cellSize.z)
      const steps = Math.max(2, Math.ceil(segLen / (cellMin * 0.5)))

      for (let s = 1; s < steps / 2; s++) {
        const t = s / steps
        const p = boneWorldPos.clone().lerp(childWorldPos, t)
        const svp = voxelGrid.worldToVoxel(p)
        const sidx = voxelGrid.index(svp.x, svp.y, svp.z)
        const heat = 1.0 - t * 0.7
        if (sidx >= 0 && sidx < voxelGrid.totalVoxels) {
          weights[b][sidx] = Math.max(weights[b][sidx], heat)
          voxelGrid.markSolid(sidx)
        }
      }
    }
  }
}

function seedVoxelAndNeighbors(voxelGrid: VoxelGrid, weights: Float32Array, idx: number): void {
  if (idx >= 0 && idx < voxelGrid.totalVoxels) {
    weights[idx] = 1.0
    voxelGrid.markSolid(idx)
    // Also mark neighbors solid
    const neighbors = voxelGrid.getNeighbors(idx)
    for (const n of neighbors) {
      voxelGrid.markSolid(n)
    }
  }
}

export async function computeHeatWeights(
  voxelGrid: VoxelGrid,
  bones: THREE.Bone[],
  onProgress?: (progress: number) => void
): Promise<Float32Array[]> {
  const weights: Float32Array[] = bones.map(() => new Float32Array(voxelGrid.totalVoxels))

  // Seed heat along bone segments
  const boneVoxelIndices: number[] = []
  seedBoneSegments(voxelGrid, bones, weights, boneVoxelIndices)

  // Collect all seeded voxel indices per bone for re-pinning
  const boneSeeds: Map<number, { idx: number; heat: number }[]> = new Map()
  for (let b = 0; b < bones.length; b++) {
    const seeds: { idx: number; heat: number }[] = []
    for (let i = 0; i < voxelGrid.totalVoxels; i++) {
      if (weights[b][i] > 0) {
        seeds.push({ idx: i, heat: weights[b][i] })
      }
    }
    boneSeeds.set(b, seeds)
  }

  // Pre-compute neighbor lists for all solid voxels
  const solidIndices: number[] = []
  const neighborCache: number[][] = []
  for (let i = 0; i < voxelGrid.totalVoxels; i++) {
    if (voxelGrid.isSolid(i)) {
      solidIndices.push(i)
      const rawNeighbors = voxelGrid.getNeighbors(i)
      neighborCache.push(rawNeighbors.filter((n) => voxelGrid.isSolid(n)))
    } else {
      neighborCache.push([])
    }
  }

  const buffer = new Float32Array(voxelGrid.totalVoxels)

  // Diffuse heat iteratively
  for (let iter = 0; iter < HEAT_DIFFUSION_ITERATIONS; iter++) {
    for (let b = 0; b < bones.length; b++) {
      const src = weights[b]
      buffer.set(src)

      for (const i of solidIndices) {
        const neighbors = neighborCache[i]
        if (neighbors.length === 0) continue
        let sum = 0
        for (let n = 0; n < neighbors.length; n++) {
          sum += src[neighbors[n]]
        }
        // Blend: keep some of the current value for stability
        buffer[i] = buffer[i] * 0.3 + (sum / neighbors.length) * 0.7
      }

      // Re-pin all bone seed voxels
      const seeds = boneSeeds.get(b)!
      for (const seed of seeds) {
        buffer[seed.idx] = seed.heat
      }

      weights[b].set(buffer)
    }

    onProgress?.((iter + 1) / HEAT_DIFFUSION_ITERATIONS)

    if (iter % 4 === 0) {
      await yieldToMain()
    }
  }

  return weights
}

/**
 * Trilinear interpolation: sample bone weights at a fractional voxel
 * position by blending the 8 surrounding voxel values.
 */
function trilinearSample(
  voxelGrid: VoxelGrid,
  boneWeights: Float32Array,
  fx: number, fy: number, fz: number
): number {
  const x0 = Math.max(0, Math.min(voxelGrid.resolution - 1, Math.floor(fx)))
  const y0 = Math.max(0, Math.min(voxelGrid.resolution - 1, Math.floor(fy)))
  const z0 = Math.max(0, Math.min(voxelGrid.resolution - 1, Math.floor(fz)))
  const x1 = Math.min(voxelGrid.resolution - 1, x0 + 1)
  const y1 = Math.min(voxelGrid.resolution - 1, y0 + 1)
  const z1 = Math.min(voxelGrid.resolution - 1, z0 + 1)

  const tx = Math.max(0, Math.min(1, fx - x0))
  const ty = Math.max(0, Math.min(1, fy - y0))
  const tz = Math.max(0, Math.min(1, fz - z0))

  const c000 = boneWeights[voxelGrid.index(x0, y0, z0)]
  const c100 = boneWeights[voxelGrid.index(x1, y0, z0)]
  const c010 = boneWeights[voxelGrid.index(x0, y1, z0)]
  const c110 = boneWeights[voxelGrid.index(x1, y1, z0)]
  const c001 = boneWeights[voxelGrid.index(x0, y0, z1)]
  const c101 = boneWeights[voxelGrid.index(x1, y0, z1)]
  const c011 = boneWeights[voxelGrid.index(x0, y1, z1)]
  const c111 = boneWeights[voxelGrid.index(x1, y1, z1)]

  const c00 = c000 * (1 - tx) + c100 * tx
  const c10 = c010 * (1 - tx) + c110 * tx
  const c01 = c001 * (1 - tx) + c101 * tx
  const c11 = c011 * (1 - tx) + c111 * tx

  const c0 = c00 * (1 - ty) + c10 * ty
  const c1 = c01 * (1 - ty) + c11 * ty

  return c0 * (1 - tz) + c1 * tz
}

export function vertexWeightsFromVoxels(
  voxelGrid: VoxelGrid,
  boneWeights: Float32Array[],
  vertexPositions: THREE.Vector3[],
  worldMatrix: THREE.Matrix4
): SkinWeights {
  const vertexCount = vertexPositions.length
  const boneCount = boneWeights.length
  const indices = new Uint16Array(vertexCount * MAX_BONE_INFLUENCES)
  const weights = new Float32Array(vertexCount * MAX_BONE_INFLUENCES)

  for (let v = 0; v < vertexCount; v++) {
    const worldPos = vertexPositions[v].clone().applyMatrix4(worldMatrix)
    const fracPos = voxelGrid.worldToVoxelFrac(worldPos)

    // Use trilinear interpolation for smooth weight sampling
    const boneInfluences: { index: number; weight: number }[] = []
    for (let b = 0; b < boneCount; b++) {
      const w = trilinearSample(voxelGrid, boneWeights[b], fracPos.x, fracPos.y, fracPos.z)
      if (w > WEIGHT_THRESHOLD) {
        boneInfluences.push({ index: b, weight: w })
      }
    }

    // If no weights from trilinear, try nearest voxel + neighbors
    if (boneInfluences.length === 0) {
      const voxelPos = voxelGrid.worldToVoxel(worldPos)
      const nearby = sampleNearby(voxelGrid, boneWeights, boneCount, voxelPos.x, voxelPos.y, voxelPos.z)
      boneInfluences.push(...nearby)
    }

    // Sort by weight descending, keep top 4
    boneInfluences.sort((a, b) => b.weight - a.weight)
    const top = boneInfluences.slice(0, MAX_BONE_INFLUENCES)

    const totalWeight = top.reduce((s, bi) => s + bi.weight, 0)
    const base = v * MAX_BONE_INFLUENCES

    if (totalWeight > 0) {
      for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
        if (i < top.length) {
          indices[base + i] = top[i].index
          weights[base + i] = top[i].weight / totalWeight
        } else {
          indices[base + i] = 0
          weights[base + i] = 0
        }
      }
    } else {
      // Fallback: nearest bone by world distance
      indices[base] = findNearestBone(worldPos, boneWeights, voxelGrid)
      weights[base] = 1.0
      for (let i = 1; i < MAX_BONE_INFLUENCES; i++) {
        indices[base + i] = 0
        weights[base + i] = 0
      }
    }
  }

  return { indices, weights }
}

/** Search expanding neighborhood for bone weights */
function sampleNearby(
  voxelGrid: VoxelGrid,
  boneWeights: Float32Array[],
  boneCount: number,
  vx: number, vy: number, vz: number
): { index: number; weight: number }[] {
  for (let r = 1; r <= 4; r++) {
    const accumulated = new Map<number, number>()

    for (let dz = -r; dz <= r; dz++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) < r && Math.abs(dy) < r && Math.abs(dz) < r) continue

          const nx = vx + dx, ny = vy + dy, nz = vz + dz
          if (nx < 0 || nx >= voxelGrid.resolution ||
              ny < 0 || ny >= voxelGrid.resolution ||
              nz < 0 || nz >= voxelGrid.resolution) continue

          const nIdx = voxelGrid.index(nx, ny, nz)
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          const distWeight = 1.0 / (1.0 + dist)

          for (let b = 0; b < boneCount; b++) {
            const w = boneWeights[b][nIdx] ?? 0
            if (w > WEIGHT_THRESHOLD) {
              accumulated.set(b, (accumulated.get(b) ?? 0) + w * distWeight)
            }
          }
        }
      }
    }

    if (accumulated.size > 0) {
      const result: { index: number; weight: number }[] = []
      accumulated.forEach((weight, index) => result.push({ index, weight }))
      return result
    }
  }

  return []
}

/** Find the bone whose seeded voxels are closest to a world position */
function findNearestBone(
  worldPos: THREE.Vector3,
  boneWeights: Float32Array[],
  voxelGrid: VoxelGrid
): number {
  const vp = voxelGrid.worldToVoxel(worldPos)
  let bestBone = 0
  let bestDist = Infinity

  for (let b = 0; b < boneWeights.length; b++) {
    // Find closest voxel with high weight for this bone
    for (let r = 0; r <= 8; r++) {
      let found = false
      for (let dz = -r; dz <= r && !found; dz++) {
        for (let dy = -r; dy <= r && !found; dy++) {
          for (let dx = -r; dx <= r && !found; dx++) {
            if (r > 0 && Math.abs(dx) < r && Math.abs(dy) < r && Math.abs(dz) < r) continue
            const nx = vp.x + dx, ny = vp.y + dy, nz = vp.z + dz
            if (nx < 0 || nx >= voxelGrid.resolution ||
                ny < 0 || ny >= voxelGrid.resolution ||
                nz < 0 || nz >= voxelGrid.resolution) continue
            const idx = voxelGrid.index(nx, ny, nz)
            if (boneWeights[b][idx] > 0.5) {
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
              if (dist < bestDist) {
                bestDist = dist
                bestBone = b
              }
              found = true
            }
          }
        }
      }
      if (found) break
    }
  }

  return bestBone
}
