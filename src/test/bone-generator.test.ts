import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { generateBoneHierarchy, collectBones } from '../core/rigging/BoneGenerator'
import { humanoidTemplate } from '../core/skeleton/HumanoidTemplate'
import { quadrupedTemplate } from '../core/skeleton/QuadrupedTemplate'

describe('BoneGenerator', () => {
  it('generates bone hierarchy from humanoid template', () => {
    const root = generateBoneHierarchy(humanoidTemplate)
    expect(root).toBeInstanceOf(THREE.Bone)
    expect(root.name).toBe('Hips')
  })

  it('generates correct number of bones', () => {
    const root = generateBoneHierarchy(humanoidTemplate)
    const bones = collectBones(root)
    expect(bones.length).toBe(humanoidTemplate.bones.length)
  })

  it('sets bone positions from template defaults', () => {
    const root = generateBoneHierarchy(humanoidTemplate)
    const [x, y, z] = humanoidTemplate.bones[0].defaultLocalPosition
    expect(root.position.x).toBeCloseTo(x)
    expect(root.position.y).toBeCloseTo(y)
    expect(root.position.z).toBeCloseTo(z)
  })

  it('creates parent-child relationships', () => {
    const root = generateBoneHierarchy(humanoidTemplate)
    // Root should have children (Spine, LeftUpperLeg, RightUpperLeg)
    const boneChildren = root.children.filter((c) => c instanceof THREE.Bone)
    expect(boneChildren.length).toBeGreaterThanOrEqual(1)
  })

  it('generates quadruped skeleton', () => {
    const root = generateBoneHierarchy(quadrupedTemplate)
    const bones = collectBones(root)
    expect(bones.length).toBe(quadrupedTemplate.bones.length)
    expect(root.name).toBe('Root')
  })
})
