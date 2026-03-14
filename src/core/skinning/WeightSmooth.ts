import * as THREE from 'three'
import { MAX_BONE_INFLUENCES, WEIGHT_THRESHOLD } from '../../utils/constants'
import type { SkinWeights } from './HeatDiffusion'

export function smoothWeights(
  skinWeights: SkinWeights,
  geometry: THREE.BufferGeometry,
  iterations: number = 6
): SkinWeights {
  const positions = geometry.getAttribute('position')
  const vertexCount = positions.count
  const indices = new Uint16Array(skinWeights.indices)
  const weights = new Float32Array(skinWeights.weights)

  // Build adjacency from geometry index or generate from positions
  const adjacency = buildAdjacency(geometry)

  // If no adjacency (no index buffer), build from position proximity
  if (adjacency.size === 0) {
    buildProximityAdjacency(geometry, adjacency)
  }

  for (let iter = 0; iter < iterations; iter++) {
    const newWeights = new Float32Array(weights)
    const newIndices = new Uint16Array(indices)

    for (let v = 0; v < vertexCount; v++) {
      const neighbors = adjacency.get(v)
      if (!neighbors || neighbors.length === 0) continue

      // Collect all bone influences from this vertex and its neighbors
      const boneMap = new Map<number, number>()
      const base = v * MAX_BONE_INFLUENCES

      // Current vertex weights (stronger influence)
      for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
        const boneIdx = indices[base + i]
        const w = weights[base + i]
        if (w > 0) {
          boneMap.set(boneIdx, (boneMap.get(boneIdx) ?? 0) + w * 2)
        }
      }

      // Neighbor weights
      for (const n of neighbors) {
        const nBase = n * MAX_BONE_INFLUENCES
        for (let j = 0; j < MAX_BONE_INFLUENCES; j++) {
          const boneIdx = indices[nBase + j]
          const w = weights[nBase + j]
          if (w > 0) {
            boneMap.set(boneIdx, (boneMap.get(boneIdx) ?? 0) + w)
          }
        }
      }

      // Pick top MAX_BONE_INFLUENCES bones
      const sorted = Array.from(boneMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_BONE_INFLUENCES)

      // Normalize
      let total = 0
      for (const [, w] of sorted) total += w
      if (total <= 0) continue

      for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
        if (i < sorted.length) {
          newIndices[base + i] = sorted[i][0]
          newWeights[base + i] = sorted[i][1] / total
        } else {
          newIndices[base + i] = 0
          newWeights[base + i] = 0
        }
      }
    }

    indices.set(newIndices)
    weights.set(newWeights)
  }

  // Final: threshold small weights and renormalize
  for (let v = 0; v < vertexCount; v++) {
    const base = v * MAX_BONE_INFLUENCES
    let total = 0
    for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
      if (weights[base + i] < WEIGHT_THRESHOLD) {
        weights[base + i] = 0
      }
      total += weights[base + i]
    }
    if (total > 0) {
      for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
        weights[base + i] /= total
      }
    }
  }

  return { indices, weights }
}

function buildAdjacency(geometry: THREE.BufferGeometry): Map<number, number[]> {
  const adjacency = new Map<number, number[]>()
  const index = geometry.getIndex()

  if (!index) return adjacency

  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i)
    const b = index.getX(i + 1)
    const c = index.getX(i + 2)

    addEdge(adjacency, a, b)
    addEdge(adjacency, b, c)
    addEdge(adjacency, c, a)
  }

  return adjacency
}

/** Build adjacency from position proximity for non-indexed geometry */
function buildProximityAdjacency(
  geometry: THREE.BufferGeometry,
  adjacency: Map<number, number[]>
): void {
  const position = geometry.getAttribute('position')
  const count = position.count
  const threshold = 0.001

  // For non-indexed geometry, share vertices at same position
  for (let i = 0; i < count; i++) {
    if (!adjacency.has(i)) adjacency.set(i, [])
    const xi = position.getX(i), yi = position.getY(i), zi = position.getZ(i)

    // Check vertices in same triangle and nearby
    const triStart = Math.floor(i / 3) * 3
    for (let j = triStart; j < Math.min(triStart + 3, count); j++) {
      if (j !== i) addEdge(adjacency, i, j)
    }

    // Check adjacent triangles (nearby indices)
    for (let j = Math.max(0, triStart - 3); j < Math.min(count, triStart + 6); j++) {
      if (j === i) continue
      const dx = xi - position.getX(j)
      const dy = yi - position.getY(j)
      const dz = zi - position.getZ(j)
      if (dx * dx + dy * dy + dz * dz < threshold) {
        addEdge(adjacency, i, j)
      }
    }
  }
}

function addEdge(adj: Map<number, number[]>, a: number, b: number) {
  if (!adj.has(a)) adj.set(a, [])
  if (!adj.has(b)) adj.set(b, [])
  const listA = adj.get(a)!
  const listB = adj.get(b)!
  if (!listA.includes(b)) listA.push(b)
  if (!listB.includes(a)) listB.push(a)
}
