import React from 'react'
import { OrbitControls } from '@react-three/drei'

export function SceneControls() {
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.1}
      minDistance={0.5}
      maxDistance={20}
      maxPolarAngle={Math.PI * 0.9}
    />
  )
}
