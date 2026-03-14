import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { centerObject, normalizeScale, getVertexPositions, extractGeometries } from '../utils/meshUtils'

describe('meshUtils', () => {
  function createTestMesh(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const material = new THREE.MeshBasicMaterial()
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(5, 5, 5)
    return mesh
  }

  it('centers object at origin', () => {
    const mesh = createTestMesh()
    centerObject(mesh)
    const box = new THREE.Box3().setFromObject(mesh)
    const center = new THREE.Vector3()
    box.getCenter(center)
    expect(center.x).toBeCloseTo(0, 1)
    expect(center.z).toBeCloseTo(0, 1)
  })

  it('normalizes scale to target size', () => {
    const mesh = createTestMesh()
    normalizeScale(mesh, 1)
    mesh.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(mesh)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    expect(maxDim).toBeCloseTo(1, 0)
  })

  it('extracts geometries from scene', () => {
    const group = new THREE.Group()
    group.add(createTestMesh())
    group.add(createTestMesh())
    const geos = extractGeometries(group)
    expect(geos.length).toBe(2)
  })

  it('gets vertex positions from geometry', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const vertices = getVertexPositions(geometry)
    expect(vertices.length).toBeGreaterThan(0)
    expect(vertices[0]).toBeInstanceOf(THREE.Vector3)
  })
})
