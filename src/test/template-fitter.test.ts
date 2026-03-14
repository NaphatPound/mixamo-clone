import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { fitTemplateToBones, validateSkeleton } from '../core/skeleton/TemplateFitter'
import { humanoidTemplate } from '../core/skeleton/HumanoidTemplate'

describe('TemplateFitter', () => {
  it('fits template with empty landmarks (uses defaults)', () => {
    const landmarks = new Map<string, THREE.Vector3>()
    const root = fitTemplateToBones(humanoidTemplate, landmarks)
    expect(root).toBeInstanceOf(THREE.Bone)
    expect(root.name).toBe('Hips')
  })

  it('positions bones from landmarks when provided', () => {
    const landmarks = new Map<string, THREE.Vector3>()
    landmarks.set('hips', new THREE.Vector3(0, 1.5, 0))
    const root = fitTemplateToBones(humanoidTemplate, landmarks)
    expect(root.position.y).toBeCloseTo(1.5)
  })

  it('validates skeleton correctly', () => {
    const landmarks = new Map<string, THREE.Vector3>()
    const root = fitTemplateToBones(humanoidTemplate, landmarks)
    const errors = validateSkeleton(root)
    expect(errors.length).toBe(0)
  })

  it('detects duplicate bone names', () => {
    const bone = new THREE.Bone()
    bone.name = 'TestBone'
    const child1 = new THREE.Bone()
    child1.name = 'TestBone' // duplicate!
    bone.add(child1)
    const errors = validateSkeleton(bone)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('Duplicate')
  })
})
