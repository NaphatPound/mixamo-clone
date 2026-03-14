import { describe, it, expect } from 'vitest'
import { createCustomTemplate, addBoneToTemplate, removeBoneFromTemplate } from '../core/skeleton/CustomTemplate'
import type { BoneDefinition } from '../core/skeleton/SkeletonTemplate'

describe('CustomTemplate', () => {
  it('creates a custom template', () => {
    const template = createCustomTemplate('MyRig', [
      { name: 'Root', parent: null, defaultLocalPosition: [0, 0, 0] },
      { name: 'Child', parent: 'Root', defaultLocalPosition: [0, 1, 0] },
    ], [])
    expect(template.type).toBe('custom')
    expect(template.name).toBe('MyRig')
    expect(template.bones.length).toBe(2)
  })

  it('adds bone to template', () => {
    const template = createCustomTemplate('Test', [
      { name: 'Root', parent: null, defaultLocalPosition: [0, 0, 0] },
    ], [])
    const newBone: BoneDefinition = { name: 'NewBone', parent: 'Root', defaultLocalPosition: [0, 1, 0] }
    const updated = addBoneToTemplate(template, newBone)
    expect(updated.bones.length).toBe(2)
    expect(updated.bones[1].name).toBe('NewBone')
  })

  it('removes bone and its children from template', () => {
    const template = createCustomTemplate('Test', [
      { name: 'Root', parent: null, defaultLocalPosition: [0, 0, 0] },
      { name: 'Child', parent: 'Root', defaultLocalPosition: [0, 1, 0] },
      { name: 'GrandChild', parent: 'Child', defaultLocalPosition: [0, 2, 0] },
    ], [])
    const updated = removeBoneFromTemplate(template, 'Child')
    // Should remove Child and GrandChild (whose parent is Child)
    expect(updated.bones.length).toBe(1)
    expect(updated.bones[0].name).toBe('Root')
  })
})
