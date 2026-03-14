import { describe, it, expect } from 'vitest'
import { SUPPORTED_FORMATS, SKELETON_TYPES, MAX_BONE_INFLUENCES, COLORS } from '../utils/constants'

describe('constants', () => {
  it('defines supported 3D file formats', () => {
    expect(SUPPORTED_FORMATS).toContain('.glb')
    expect(SUPPORTED_FORMATS).toContain('.fbx')
    expect(SUPPORTED_FORMATS).toContain('.obj')
  })

  it('defines skeleton types', () => {
    expect(SKELETON_TYPES).toContain('humanoid')
    expect(SKELETON_TYPES).toContain('quadruped')
    expect(SKELETON_TYPES).toContain('bird')
    expect(SKELETON_TYPES).toContain('custom')
  })

  it('limits bone influences to 4 (GPU standard)', () => {
    expect(MAX_BONE_INFLUENCES).toBe(4)
  })

  it('defines color palette', () => {
    expect(COLORS.accent).toBeDefined()
    expect(COLORS.bone).toBeDefined()
    expect(COLORS.marker).toBeDefined()
  })
})
