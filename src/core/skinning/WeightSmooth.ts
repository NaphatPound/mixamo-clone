import * as THREE from 'three'
import { MAX_BONE_INFLUENCES, WEIGHT_THRESHOLD } from '../../utils/constants'
import type { SkinWeights } from './HeatDiffusion'

export function smoothWeights(
  skinWeights: SkinWeights,
  geometry: THREE.BufferGeometry,
  iterations: number = 3
): SkinWeights {
  const positions = geometry.getAttribute('position')
  const vertexCount = positions.count
  const indices = new Uint16Array(skinWeights.indices)
  const weights = new Float32Array(skinWeights.weights)

  // Build adjacency from geometry index
  const adjacency = buildAdjacency(geometry)

  for (let iter = 0; iter < iterations; iter++) {
    const newWeights = new Float32Array(weights)

    for (let v = 0; v < vertexCount; v++) {
      const neighbors = adjacency.get(v)
      if (!neighbors || neighbors.length === 0) continue

      const base = v * MAX_BONE_INFLUENCES
      for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
        let sum = weights[base + i]
        let count = 1

        for (const n of neighbors) {
          const nBase = n * MAX_BONE_INFLUENCES
          // Find matching bone index in neighbor
          for (let j = 0; j < MAX_BONE_INFLUENCES; j++) {
            if (indices[nBase + j] === indices[base + i]) {
              sum += weights[nBase + j]
              count++
              break
            }
          }
        }

        newWeights[base + i] = sum / count
      }

      // Normalize
      let total = 0
      for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
        total += newWeights[base + i]
      }
      if (total > 0) {
        for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
          newWeights[base + i] /= total
          if (newWeights[base + i] < WEIGHT_THRESHOLD) {
            newWeights[base + i] = 0
          }
        }
      }
    }

    weights.set(newWeights)
  }

  // Final normalization
  for (let v = 0; v < vertexCount; v++) {
    const base = v * MAX_BONE_INFLUENCES
    let total = 0
    for (let i = 0; i < MAX_BONE_INFLUENCES; i++) {
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

function addEdge(adj: Map<number, number[]>, a: number, b: number) {
  if (!adj.has(a)) adj.set(a, [])
  if (!adj.has(b)) adj.set(b, [])
  const listA = adj.get(a)!
  const listB = adj.get(b)!
  if (!listA.includes(b)) listA.push(b)
  if (!listB.includes(a)) listB.push(a)
}
