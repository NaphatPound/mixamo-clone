import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { AnimationPlayer } from '../core/preview/AnimationPlayer'

describe('AnimationPlayer', () => {
  it('initializes in stopped state', () => {
    const root = new THREE.Object3D()
    const player = new AnimationPlayer(root)
    expect(player.isPlaying).toBe(false)
    expect(player.speed).toBe(1)
    expect(player.currentTime).toBe(0)
  })

  it('can play a clip', () => {
    const root = new THREE.Object3D()
    const player = new AnimationPlayer(root)
    const track = new THREE.NumberKeyframeTrack('.position[0]', [0, 1], [0, 1])
    const clip = new THREE.AnimationClip('test', 1, [track])
    player.play(clip)
    expect(player.isPlaying).toBe(true)
    expect(player.duration).toBe(1)
  })

  it('can stop playback', () => {
    const root = new THREE.Object3D()
    const player = new AnimationPlayer(root)
    const track = new THREE.NumberKeyframeTrack('.position[0]', [0, 1], [0, 1])
    const clip = new THREE.AnimationClip('test', 1, [track])
    player.play(clip)
    player.stop()
    expect(player.isPlaying).toBe(false)
  })

  it('can set speed', () => {
    const root = new THREE.Object3D()
    const player = new AnimationPlayer(root)
    player.setSpeed(2)
    expect(player.speed).toBe(2)
  })

  it('disposes cleanly', () => {
    const root = new THREE.Object3D()
    const player = new AnimationPlayer(root)
    expect(() => player.dispose()).not.toThrow()
  })
})
