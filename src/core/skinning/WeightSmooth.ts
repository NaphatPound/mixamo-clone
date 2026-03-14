import * as THREE from 'three'
import { MAX_BONE_INFLUENCES, WEIGHT_THRESHOLD } from '../../utils/constants'
import type { SkinWeights } from './HeatDiffusion'

/**
 * Smooth skin weights using Laplacian smoothing on per-bone weight maps.
 *
 * Instead of smoothing the packed (index, weight) pairs directly
 * (which can flip bone indices between neighbors and cause tearing),
 * we expand weights into a full [vertex x bone] matrix, smooth each
 * bone's column independently on the mesh surface, then re-select
 * the top MAX_BONE_INFLUENCES per vertex.
 */
export function smoothWeights(
  skinWeights: SkinWeights,
  geometry: THREE.BufferGeometry,
  iterations: number = 8
): SkinWeights {
  const vertexCount = geometry.getAttribute('position').count

  // Build adjacency
  let adjacency = buildAdjacency(geometry)
  if (adjacency.size === 0) {
    adjacency = buildProximityAdjacency(geometry)
  }

  // Collect all unique bone indices used
  const boneSet = new Set<number>()
  for (let v = 0; v < vertexCount; v++) {
    const base = v * MAX_BONE_INFLUENCES
    for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
      if (skinWeights.weights[base + i] > 0) {
        boneSet.add(skinWeights.indices[base + i])
      }
    }
  }
  const usedBones = Array.from(boneSet).sort((a, b) => a - b)
  const boneToCol = new Map<number, number>()
  usedBones.forEach((b, i) => boneToCol.set(b, i))
  const numBones = usedBones.length

  // Expand into full [vertex x bone] weight matrix
  const weightMap = new Float32Array(vertexCount * numBones)
  for (let v = 0; v < vertexCount; v++) {
    const base = v * MAX_BONE_INFLUENCES
    for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
      const w = skinWeights.weights[base + i]
      if (w > 0) {
        const col = boneToCol.get(skinWeights.indices[base + i])!
        weightMap[v * numBones + col] += w
      }
    }
  }

  // Laplacian smoothing: smooth each bone's weight column independently
  // This preserves spatial continuity — neighboring vertices will have
  // similar weights for the same bone, preventing tearing.
  const buffer = new Float32Array(vertexCount)

  for (let iter = 0; iter < iterations; iter++) {
    for (let bCol = 0; bCol < numBones; bCol++) {
      // Extract this bone's column
      for (let v = 0; v < vertexCount; v++) {
        buffer[v] = weightMap[v * numBones + bCol]
      }

      // Laplacian smooth: blend with neighbor average
      for (let v = 0; v < vertexCount; v++) {
        const neighbors = adjacency.get(v)
        if (!neighbors || neighbors.length === 0) continue

        let sum = 0
        for (const n of neighbors) {
          sum += weightMap[n * numBones + bCol]
        }
        const neighborAvg = sum / neighbors.length

        // 60% self + 40% neighbor average — enough smoothing without losing detail
        buffer[v] = weightMap[v * numBones + bCol] * 0.6 + neighborAvg * 0.4
      }

      // Write back
      for (let v = 0; v < vertexCount; v++) {
        weightMap[v * numBones + bCol] = buffer[v]
      }
    }

    // Normalize weights per vertex after each iteration
    for (let v = 0; v < vertexCount; v++) {
      let total = 0
      for (let bCol = 0; bCol < numBones; bCol++) {
        total += weightMap[v * numBones + bCol]
      }
      if (total > 0) {
        for (let bCol = 0; bCol < numBones; bCol++) {
          weightMap[v * numBones + bCol] /= total
        }
      }
    }
  }

  // Re-pack: select top MAX_BONE_INFLUENCES per vertex
  const indices = new Uint16Array(vertexCount * MAX_BONE_INFLUENCES)
  const weights = new Float32Array(vertexCount * MAX_BONE_INFLUENCES)

  // Reusable array for sorting
  const boneWeightPairs: { bone: number; weight: number }[] = []

  for (let v = 0; v < vertexCount; v++) {
    boneWeightPairs.length = 0

    for (let bCol = 0; bCol < numBones; bCol++) {
      const w = weightMap[v * numBones + bCol]
      if (w > WEIGHT_THRESHOLD) {
        boneWeightPairs.push({ bone: usedBones[bCol], weight: w })
      }
    }

    boneWeightPairs.sort((a, b) => b.weight - a.weight)

    const base = v * MAX_BONE_INFLUENCES
    let total = 0
    const count = Math.min(boneWeightPairs.length, MAX_BONE_INFLUENCES)
    for (let i = 0; i < count; i++) {
      total += boneWeightPairs[i].weight
    }

    if (total > 0) {
      for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
        if (i < count) {
          indices[base + i] = boneWeightPairs[i].bone
          weights[base + i] = boneWeightPairs[i].weight / total
        } else {
          indices[base + i] = 0
          weights[base + i] = 0
        }
      }
    } else {
      // Keep original weights if smoothing zeroed everything
      for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
        indices[base + i] = skinWeights.indices[v * MAX_BONE_INFLUENCES + i]
        weights[base + i] = skinWeights.weights[v * MAX_BONE_INFLUENCES + i]
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

function buildProximityAdjacency(geometry: THREE.BufferGeometry): Map<number, number[]> {
  const adjacency = new Map<number, number[]>()
  const position = geometry.getAttribute('position')
  const count = position.count
  const threshold = 0.0001

  for (let i = 0; i < count; i++) {
    if (!adjacency.has(i)) adjacency.set(i, [])

    // Vertices in same triangle
    const triStart = Math.floor(i / 3) * 3
    for (let j = triStart; j < Math.min(triStart + 3, count); j++) {
      if (j !== i) addEdge(adjacency, i, j)
    }

    // Shared positions across triangles
    const xi = position.getX(i), yi = position.getY(i), zi = position.getZ(i)
    for (let j = Math.max(0, triStart - 6); j < Math.min(count, triStart + 9); j++) {
      if (j === i) continue
      const dx = xi - position.getX(j)
      const dy = yi - position.getY(j)
      const dz = zi - position.getZ(j)
      if (dx * dx + dy * dy + dz * dz < threshold) {
        addEdge(adjacency, i, j)
      }
    }
  }

  return adjacency
}

function addEdge(adj: Map<number, number[]>, a: number, b: number) {
  if (!adj.has(a)) adj.set(a, [])
  if (!adj.has(b)) adj.set(b, [])
  const listA = adj.get(a)!
  const listB = adj.get(b)!
  if (!listA.includes(b)) listA.push(b)
  if (!listB.includes(a)) listB.push(a)
}
