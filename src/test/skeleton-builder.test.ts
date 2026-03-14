import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { buildSkeleton, getSkeletonInfo } from '../core/rigging/SkeletonBuilder'
import { generateBoneHierarchy } from '../core/rigging/BoneGenerator'
import { humanoidTemplate } from '../core/skeleton/HumanoidTemplate'

describe('SkeletonBuilder', () => {
  it('builds skeleton from bone hierarchy', () => {
    const root = generateBoneHierarchy(humanoidTemplate)
    const skeleton = buildSkeleton(root)
    expect(skeleton).toBeInstanceOf(THREE.Skeleton)
    expect(skeleton.bones.length).toBe(humanoidTemplate.bones.length)
  })

  it('returns correct skeleton info', () => {
    const root = generateBoneHierarchy(humanoidTemplate)
    const skeleton = buildSkeleton(root)
    const info = getSkeletonInfo(skeleton)
    expect(info.boneCount).toBe(humanoidTemplate.bones.length)
    expect(info.maxDepth).toBeGreaterThan(0)
    expect(info.boneNames).toContain('Hips')
    expect(info.boneNames).toContain('Head')
  })
})
