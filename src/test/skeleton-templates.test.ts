import { describe, it, expect } from 'vitest'
import { humanoidTemplate } from '../core/skeleton/HumanoidTemplate'
import { quadrupedTemplate } from '../core/skeleton/QuadrupedTemplate'
import { birdTemplate } from '../core/skeleton/BirdTemplate'
import type { SkeletonTemplate } from '../core/skeleton/SkeletonTemplate'

function validateTemplate(template: SkeletonTemplate) {
  // Every bone except root must have a valid parent
  const boneNames = new Set(template.bones.map((b) => b.name))

  for (const bone of template.bones) {
    if (bone.parent !== null) {
      expect(boneNames.has(bone.parent), `Bone "${bone.name}" references missing parent "${bone.parent}"`).toBe(true)
    }
  }

  // No duplicate bone names
  expect(boneNames.size).toBe(template.bones.length)

  // First bone should be root (no parent)
  expect(template.bones[0].parent).toBeNull()

  // All landmark keys in bones should reference defined landmarks
  const allLandmarkKeys = new Set([
    ...template.requiredLandmarks.map((l) => l.key),
    ...template.optionalLandmarks.map((l) => l.key),
  ])

  for (const bone of template.bones) {
    if (bone.landmarkKey) {
      expect(
        allLandmarkKeys.has(bone.landmarkKey),
        `Bone "${bone.name}" uses undefined landmark "${bone.landmarkKey}"`
      ).toBe(true)
    }
  }

  // defaultLocalPosition should be arrays of 3 numbers
  for (const bone of template.bones) {
    expect(bone.defaultLocalPosition).toHaveLength(3)
    bone.defaultLocalPosition.forEach((v) => {
      expect(typeof v).toBe('number')
      expect(isNaN(v)).toBe(false)
    })
  }
}

describe('Humanoid Template', () => {
  it('has valid bone hierarchy', () => {
    validateTemplate(humanoidTemplate)
  })

  it('has at least 50 bones', () => {
    expect(humanoidTemplate.bones.length).toBeGreaterThanOrEqual(50)
  })

  it('includes required body parts', () => {
    const names = humanoidTemplate.bones.map((b) => b.name)
    expect(names).toContain('Hips')
    expect(names).toContain('Spine')
    expect(names).toContain('Head')
    expect(names).toContain('LeftUpperArm')
    expect(names).toContain('RightUpperArm')
    expect(names).toContain('LeftUpperLeg')
    expect(names).toContain('RightUpperLeg')
  })

  it('has required landmarks', () => {
    expect(humanoidTemplate.requiredLandmarks.length).toBeGreaterThanOrEqual(10)
    const keys = humanoidTemplate.requiredLandmarks.map((l) => l.key)
    expect(keys).toContain('hips')
    expect(keys).toContain('headTop')
    expect(keys).toContain('leftShoulder')
    expect(keys).toContain('rightShoulder')
  })

  it('is symmetrical (same number of left/right bones)', () => {
    const leftBones = humanoidTemplate.bones.filter((b) => b.name.startsWith('Left'))
    const rightBones = humanoidTemplate.bones.filter((b) => b.name.startsWith('Right'))
    expect(leftBones.length).toBe(rightBones.length)
  })
})

describe('Quadruped Template', () => {
  it('has valid bone hierarchy', () => {
    validateTemplate(quadrupedTemplate)
  })

  it('has at least 25 bones', () => {
    expect(quadrupedTemplate.bones.length).toBeGreaterThanOrEqual(25)
  })

  it('includes tail bones', () => {
    const tailBones = quadrupedTemplate.bones.filter((b) => b.name.startsWith('Tail'))
    expect(tailBones.length).toBeGreaterThanOrEqual(3)
  })

  it('includes four legs', () => {
    const names = quadrupedTemplate.bones.map((b) => b.name)
    expect(names).toContain('FrontLeftShoulder')
    expect(names).toContain('FrontRightShoulder')
    expect(names).toContain('HindLeftHip')
    expect(names).toContain('HindRightHip')
  })
})

describe('Bird Template', () => {
  it('has valid bone hierarchy', () => {
    validateTemplate(birdTemplate)
  })

  it('includes wing bones', () => {
    const wingBones = birdTemplate.bones.filter((b) => b.name.includes('Wing'))
    expect(wingBones.length).toBeGreaterThanOrEqual(4)
  })

  it('includes neck chain', () => {
    const neckBones = birdTemplate.bones.filter((b) => b.name.startsWith('Neck'))
    expect(neckBones.length).toBeGreaterThanOrEqual(2)
  })
})
