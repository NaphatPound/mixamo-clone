import React, { useRef, useCallback } from 'react'
import { useThree, ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useRigStore } from '../../store/useRigStore'
import { useAppStore } from '../../store/useAppStore'
import { useModelStore } from '../../store/useModelStore'
import { humanoidTemplate } from '../../core/skeleton/HumanoidTemplate'
import { quadrupedTemplate } from '../../core/skeleton/QuadrupedTemplate'
import { birdTemplate } from '../../core/skeleton/BirdTemplate'
import type { SkeletonTemplate, LandmarkDefinition } from '../../core/skeleton/SkeletonTemplate'

function getTemplate(type: string | null): SkeletonTemplate | null {
  switch (type) {
    case 'humanoid': return humanoidTemplate
    case 'quadruped': return quadrupedTemplate
    case 'bird': return birdTemplate
    default: return null
  }
}

function getLandmarkDef(template: SkeletonTemplate, key: string): LandmarkDefinition | undefined {
  return (
    template.requiredLandmarks.find((l) => l.key === key) ??
    template.optionalLandmarks.find((l) => l.key === key)
  )
}

function MarkerSphere({ position, color, label, landmarkKey }: {
  position: THREE.Vector3
  color: string
  label: string
  landmarkKey: string
}) {
  const activeLandmarkKey = useRigStore((s) => s.activeLandmarkKey)
  const isActive = activeLandmarkKey === landmarkKey

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 1.0 : 0.5}
          transparent
          opacity={0.95}
        />
      </mesh>
      {/* Outer ring for visibility */}
      <mesh>
        <ringGeometry args={[0.03, 0.04, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>
      {/* Label */}
      <Html
        center
        style={{
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          fontSize: '10px',
          color: '#fff',
          background: 'rgba(0,0,0,0.7)',
          padding: '1px 5px',
          borderRadius: '3px',
          transform: 'translateY(-20px)',
          userSelect: 'none',
        }}
      >
        {label}
      </Html>
    </group>
  )
}

export function LandmarkMarkers() {
  const currentStep = useAppStore((s) => s.currentStep)
  const model = useModelStore((s) => s.model)
  const selectedTemplate = useRigStore((s) => s.selectedTemplate)
  const landmarks = useRigStore((s) => s.landmarks)
  const activeLandmarkKey = useRigStore((s) => s.activeLandmarkKey)
  const setLandmark = useRigStore((s) => s.setLandmark)
  const setActiveLandmark = useRigStore((s) => s.setActiveLandmark)

  const template = getTemplate(selectedTemplate)
  const isLandmarkStep = currentStep === 'landmarks'

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (!isLandmarkStep || !activeLandmarkKey || !template) return

    // Stop event from propagating to OrbitControls
    e.stopPropagation()

    const point = e.point.clone()
    const def = getLandmarkDef(template, activeLandmarkKey)
    if (!def) return

    const isRequired = template.requiredLandmarks.some((l) => l.key === activeLandmarkKey)

    setLandmark(activeLandmarkKey, {
      key: activeLandmarkKey,
      label: def.label,
      position: point,
      required: isRequired,
    })

    // Auto-advance to next unplaced required landmark
    const allLandmarks = [...template.requiredLandmarks, ...template.optionalLandmarks]
    const currentIdx = allLandmarks.findIndex((l) => l.key === activeLandmarkKey)
    const nextUnplaced = allLandmarks.find((l, i) => {
      if (i <= currentIdx) return false
      const currentLandmarks = useRigStore.getState().landmarks
      return !currentLandmarks.has(l.key)
    })

    if (nextUnplaced) {
      setActiveLandmark(nextUnplaced.key)
    } else {
      // Check if any required landmarks are still missing
      const currentLandmarks = useRigStore.getState().landmarks
      const missingRequired = template.requiredLandmarks.find((l) => !currentLandmarks.has(l.key))
      if (missingRequired) {
        setActiveLandmark(missingRequired.key)
      } else {
        setActiveLandmark(null)
      }
    }
  }, [isLandmarkStep, activeLandmarkKey, template, setLandmark, setActiveLandmark])

  // Render clickable invisible mesh over the model for raycasting
  const clickPlaneRef = useRef<THREE.Group>(null)

  if (!model || !template) return null

  // Render placed markers
  const markerElements: React.ReactNode[] = []
  landmarks.forEach((data, key) => {
    const def = getLandmarkDef(template, key)
    const color = def?.color ?? '#ffffff'
    markerElements.push(
      <MarkerSphere
        key={key}
        position={data.position}
        color={color}
        label={data.label}
        landmarkKey={key}
      />
    )
  })

  return (
    <group ref={clickPlaneRef}>
      {/* Invisible clickable clone of the model for raycasting */}
      {isLandmarkStep && activeLandmarkKey && (
        <ModelClickTarget model={model} onClick={handleClick} />
      )}
      {/* Render all placed markers */}
      {markerElements}
    </group>
  )
}

function ModelClickTarget({ model, onClick }: {
  model: THREE.Object3D
  onClick: (e: ThreeEvent<MouseEvent>) => void
}) {
  const groupRef = useRef<THREE.Group>(null)

  React.useEffect(() => {
    if (!groupRef.current) return
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0])
    }

    const clone = model.clone()
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      }
    })
    groupRef.current.add(clone)
  }, [model])

  return <group ref={groupRef} onClick={onClick} />
}
