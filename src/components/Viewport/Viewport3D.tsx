import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ModelViewer } from './ModelViewer'
import { GridFloor } from './GridFloor'
import { SceneControls } from './SceneControls'
import { SkeletonOverlay } from './SkeletonOverlay'
import { LandmarkMarkers } from './LandmarkMarkers'
import { AnimationController } from './AnimationController'

export function Viewport3D() {
  return (
    <div style={{ flex: 1, position: 'relative', background: 'var(--bg-primary)' }}>
      <Canvas
        camera={{ position: [2, 2, 3], fov: 50, near: 0.01, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0f' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
          <directionalLight position={[-3, 4, -3]} intensity={0.3} />
          <GridFloor />
          <ModelViewer />
          <LandmarkMarkers />
          <SkeletonOverlay />
          <AnimationController />
          <SceneControls />
        </Suspense>
      </Canvas>
    </div>
  )
}
