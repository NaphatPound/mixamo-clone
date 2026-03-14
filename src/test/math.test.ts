import { describe, it, expect } from 'vitest'
import { lerp, clamp, smoothStep } from '../utils/math'

describe('math utilities', () => {
  describe('lerp', () => {
    it('returns start value at t=0', () => {
      expect(lerp(0, 10, 0)).toBe(0)
    })

    it('returns end value at t=1', () => {
      expect(lerp(0, 10, 1)).toBe(10)
    })

    it('returns midpoint at t=0.5', () => {
      expect(lerp(0, 10, 0.5)).toBe(5)
    })

    it('handles negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0)
    })
  })

  describe('clamp', () => {
    it('returns value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })

    it('clamps to min', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it('clamps to max', () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('handles equal min and max', () => {
      expect(clamp(5, 3, 3)).toBe(3)
    })
  })

  describe('smoothStep', () => {
    it('returns 0 below edge0', () => {
      expect(smoothStep(0, 1, -1)).toBe(0)
    })

    it('returns 1 above edge1', () => {
      expect(smoothStep(0, 1, 2)).toBe(1)
    })

    it('returns 0.5 at midpoint', () => {
      expect(smoothStep(0, 1, 0.5)).toBe(0.5)
    })
  })
})
