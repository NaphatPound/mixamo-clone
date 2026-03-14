import { describe, it, expect } from 'vitest'
import { getPlacementProgress } from '../core/markers/MarkerPresets'
import { humanoidTemplate } from '../core/skeleton/HumanoidTemplate'

describe('MarkerPresets', () => {
  it('calculates zero progress when nothing placed', () => {
    const progress = getPlacementProgress(humanoidTemplate.requiredLandmarks, new Set())
    expect(progress.placed).toBe(0)
    expect(progress.percentage).toBe(0)
    expect(progress.total).toBe(humanoidTemplate.requiredLandmarks.length)
  })

  it('calculates 100% when all required landmarks placed', () => {
    const allKeys = new Set(humanoidTemplate.requiredLandmarks.map((l) => l.key))
    const progress = getPlacementProgress(humanoidTemplate.requiredLandmarks, allKeys)
    expect(progress.percentage).toBe(100)
    expect(progress.placed).toBe(progress.total)
  })

  it('calculates partial progress', () => {
    const someKeys = new Set([humanoidTemplate.requiredLandmarks[0].key])
    const progress = getPlacementProgress(humanoidTemplate.requiredLandmarks, someKeys)
    expect(progress.placed).toBe(1)
    expect(progress.percentage).toBeGreaterThan(0)
    expect(progress.percentage).toBeLessThan(100)
  })
})
