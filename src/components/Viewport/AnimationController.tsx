import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRigStore } from '../../store/useRigStore'
import { useAppStore } from '../../store/useAppStore'
import { AnimationPlayer } from '../../core/preview/AnimationPlayer'
import { testAnimations } from '../../core/preview/TestAnimations'
import { collectBones } from '../../core/rigging/BoneGenerator'

export function AnimationController() {
  const playerRef = useRef<AnimationPlayer | null>(null)
  const skinnedMesh = useRigStore((s) => s.skinnedMesh)
  const skeleton = useRigStore((s) => s.skeleton)
  const previewAnim = useRigStore((s) => s.previewAnim)
  const previewPlaying = useRigStore((s) => s.previewPlaying)
  const previewSpeed = useRigStore((s) => s.previewSpeed)
  const currentStep = useAppStore((s) => s.currentStep)

  // Create/destroy player when skinnedMesh changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.dispose()
      playerRef.current = null
    }

    if (skinnedMesh) {
      playerRef.current = new AnimationPlayer(skinnedMesh)
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [skinnedMesh])

  // Play/stop animation when state changes
  useEffect(() => {
    const player = playerRef.current
    if (!player || !skeleton || currentStep !== 'preview') {
      if (player) player.stop()
      return
    }

    if (previewPlaying) {
      const animDef = testAnimations[previewAnim]
      if (animDef) {
        const bones = collectBones(skeleton.bones[0])
        const clip = animDef.createClip(bones)
        player.play(clip)
        player.setSpeed(previewSpeed)
      }
    } else {
      player.stop()
    }
  }, [previewPlaying, previewAnim, skeleton, currentStep])

  // Update speed
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setSpeed(previewSpeed)
    }
  }, [previewSpeed])

  // Stop animation when leaving preview step
  useEffect(() => {
    if (currentStep !== 'preview' && playerRef.current) {
      playerRef.current.stop()
      useRigStore.getState().setPreviewPlaying(false)
    }
  }, [currentStep])

  // Update mixer each frame
  useFrame(() => {
    if (playerRef.current) {
      playerRef.current.update()
    }
  })

  return null
}
