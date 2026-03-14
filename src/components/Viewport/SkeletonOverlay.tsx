import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useRigStore } from '../../store/useRigStore'
import { useUIStore } from '../../store/useUIStore'

export function SkeletonOverlay() {
  const helperRef = useRef<THREE.SkeletonHelper | null>(null)
  const groupRef = useRef<THREE.Group>(null)
  const skeleton = useRigStore((s) => s.skeleton)
  const skinnedMesh = useRigStore((s) => s.skinnedMesh)
  const showSkeleton = useUIStore((s) => s.showSkeleton)

  useEffect(() => {
    if (!groupRef.current) return

    // Clean up old helper
    if (helperRef.current) {
      groupRef.current.remove(helperRef.current)
      helperRef.current = null
    }

    if (!skeleton || !showSkeleton) return

    // Use skinnedMesh as root if available (bones are children of it),
    // otherwise fall back to the root bone
    const helperRoot = skinnedMesh || skeleton.bones[0]
    if (!helperRoot) return

    const helper = new THREE.SkeletonHelper(helperRoot)
    helper.material = new THREE.LineBasicMaterial({
      color: 0xffcc00,
      linewidth: 2,
      depthTest: false,
      depthWrite: false,
    })
    helperRef.current = helper
    groupRef.current.add(helper)

    return () => {
      if (helperRef.current && groupRef.current) {
        groupRef.current.remove(helperRef.current)
      }
    }
  }, [skeleton, skinnedMesh, showSkeleton])

  return <group ref={groupRef} />
}
