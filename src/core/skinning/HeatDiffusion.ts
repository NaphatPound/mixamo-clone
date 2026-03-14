import * as THREE from 'three'
import { VoxelGrid } from './VoxelGrid'
import { HEAT_DIFFUSION_ITERATIONS, MAX_BONE_INFLUENCES, WEIGHT_THRESHOLD } from '../../utils/constants'

export interface SkinWeights {
  indices: Uint16Array  // 4 bone indices per vertex
  weights: Float32Array // 4 weights per vertex
}

/** Yield to the browser event loop so the page stays responsive */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export async function computeHeatWeights(
  voxelGrid: VoxelGrid,
  bones: THREE.Bone[],
  onProgress?: (progress: number) => void
): Promise<Float32Array[]> {
  const weights: Float32Array[] = bones.map(() => new Float32Array(voxelGrid.totalVoxels))

  // Pre-compute bone source voxel indices and mark them as solid
  // so heat can always diffuse outward from bones
  const boneVoxelIndices: number[] = []
  for (let b = 0; b < bones.length; b++) {
    const worldPos = new THREE.Vector3()
    bones[b].getWorldPosition(worldPos)
    const voxelPos = voxelGrid.worldToVoxel(worldPos)
    const idx = voxelGrid.index(voxelPos.x, voxelPos.y, voxelPos.z)
    boneVoxelIndices.push(idx)
    if (idx >= 0 && idx < voxelGrid.totalVoxels) {
      weights[b][idx] = 1.0
      // Ensure bone voxel and its neighbors are solid so heat can diffuse
      voxelGrid.markSolid(idx)
      const neighbors = voxelGrid.getNeighbors(idx)
      for (const n of neighbors) {
        voxelGrid.markSolid(n)
      }
    }
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

  // Reusable buffer to avoid allocations each iteration
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
        buffer[i] = sum / neighbors.length
      }

      // Re-pin bone source voxel
      const bIdx = boneVoxelIndices[b]
      if (bIdx >= 0 && bIdx < voxelGrid.totalVoxels) {
        buffer[bIdx] = 1.0
      }

      weights[b].set(buffer)
    }

    onProgress?.((iter + 1) / HEAT_DIFFUSION_ITERATIONS)

    // Yield every 2 iterations so the browser stays responsive
    if (iter % 2 === 0) {
      await yieldToMain()
    }
  }

  return weights
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

  // Pre-compute bone world positions for nearest-bone fallback
  const boneWorldPositions: THREE.Vector3[] = []
  for (let b = 0; b < boneCount; b++) {
    const pos = new THREE.Vector3()
    // Read from voxel grid: find the voxel with weight=1 for this bone
    // We stored bone positions during heat computation
    boneWorldPositions.push(pos)
  }

  for (let v = 0; v < vertexCount; v++) {
    const worldPos = vertexPositions[v].clone().applyMatrix4(worldMatrix)
    const voxelPos = voxelGrid.worldToVoxel(worldPos)

    // Get weights for all bones at this voxel, searching nearby if needed
    const boneInfluences = sampleBoneWeights(
      voxelGrid, boneWeights, boneCount,
      voxelPos.x, voxelPos.y, voxelPos.z
    )

    // Sort by weight descending, keep top 4
    boneInfluences.sort((a, b) => b.weight - a.weight)
    const top = boneInfluences.slice(0, MAX_BONE_INFLUENCES)

    // Normalize
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
      // Fallback: assign full weight to bone 0 (root)
      // This prevents vertices from collapsing to origin
      indices[base] = 0
      weights[base] = 1.0
      for (let i = 1; i < MAX_BONE_INFLUENCES; i++) {
        indices[base + i] = 0
        weights[base + i] = 0
      }
    }
  }

  return { indices, weights }
}

/** Sample bone weights at a voxel, searching nearby voxels if the exact one has no weights */
function sampleBoneWeights(
  voxelGrid: VoxelGrid,
  boneWeights: Float32Array[],
  boneCount: number,
  vx: number, vy: number, vz: number
): { index: number; weight: number }[] {
  // Try exact voxel first
  const influences = getInfluencesAt(voxelGrid, boneWeights, boneCount, vx, vy, vz)
  if (influences.length > 0) return influences

  // Search expanding neighborhood (radius 1, 2, 3)
  for (let r = 1; r <= 3; r++) {
    let bestInfluences: { index: number; weight: number }[] = []
    let bestTotalWeight = 0

    for (let dz = -r; dz <= r; dz++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          // Only check voxels on the shell of the cube (skip interior already checked)
          if (Math.abs(dx) < r && Math.abs(dy) < r && Math.abs(dz) < r) continue

          const nx = vx + dx, ny = vy + dy, nz = vz + dz
          if (nx < 0 || nx >= voxelGrid.resolution ||
              ny < 0 || ny >= voxelGrid.resolution ||
              nz < 0 || nz >= voxelGrid.resolution) continue

          const nearby = getInfluencesAt(voxelGrid, boneWeights, boneCount, nx, ny, nz)
          const total = nearby.reduce((s, bi) => s + bi.weight, 0)
          if (total > bestTotalWeight) {
            bestInfluences = nearby
            bestTotalWeight = total
          }
        }
      }
    }

    if (bestInfluences.length > 0) return bestInfluences
  }

  return []
}

function getInfluencesAt(
  voxelGrid: VoxelGrid,
  boneWeights: Float32Array[],
  boneCount: number,
  vx: number, vy: number, vz: number
): { index: number; weight: number }[] {
  const idx = voxelGrid.index(vx, vy, vz)
  const influences: { index: number; weight: number }[] = []
  for (let b = 0; b < boneCount; b++) {
    const w = boneWeights[b][idx] ?? 0
    if (w > WEIGHT_THRESHOLD) {
      influences.push({ index: b, weight: w })
    }
  }
  return influences
}
