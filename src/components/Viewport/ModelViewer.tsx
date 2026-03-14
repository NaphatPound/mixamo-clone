import React, { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useModelStore } from '../../store/useModelStore'
import { useRigStore } from '../../store/useRigStore'

export function ModelViewer() {
  const groupRef = useRef<THREE.Group>(null)
  const model = useModelStore((s) => s.model)
  const wireframe = useModelStore((s) => s.wireframe)
  const skinnedMesh = useRigStore((s) => s.skinnedMesh)
  const { camera } = useThree()

  useEffect(() => {
    if (!groupRef.current) return
    // Clear previous
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0])
    }

    // When we have a skinnedMesh, add it directly (cloning breaks skeleton binding)
    if (skinnedMesh) {
      groupRef.current.add(skinnedMesh)
      skinnedMesh.updateMatrixWorld(true)

      // Apply wireframe
      if (Array.isArray(skinnedMesh.material)) {
        skinnedMesh.material.forEach((m) => { (m as THREE.MeshStandardMaterial).wireframe = wireframe })
      } else {
        (skinnedMesh.material as THREE.MeshStandardMaterial).wireframe = wireframe
      }

      // Use the geometry bounding box since SkinnedMesh.computeBoundingBox
      // can return degenerate results before the first render
      skinnedMesh.geometry.computeBoundingBox()
      const box = skinnedMesh.geometry.boundingBox ?? new THREE.Box3()
      const size = new THREE.Vector3()
      box.getSize(size)
      const center = new THREE.Vector3()
      box.getCenter(center)
      const maxDim = Math.max(size.x, size.y, size.z)
      if (maxDim > 0) {
        const dist = maxDim * 2
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.position.set(center.x + dist, center.y + dist * 0.5, center.z + dist)
          camera.lookAt(center)
        }
      }
      return
    }

    if (!model) return

    const clone = model.clone()
    groupRef.current.add(clone)

    // Apply wireframe
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) => {
            const mat = m.clone()
            mat.wireframe = wireframe
            return mat
          })
        } else {
          child.material = child.material.clone()
          child.material.wireframe = wireframe
        }
      }
    })

    // Auto-fit camera
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    box.getSize(size)
    const center = new THREE.Vector3()
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z)
    const dist = maxDim * 2
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(center.x + dist, center.y + dist * 0.5, center.z + dist)
      camera.lookAt(center)
    }
  }, [model, skinnedMesh, wireframe, camera])

  return <group ref={groupRef} />
}
