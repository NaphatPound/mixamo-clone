import React from 'react'
import { Grid } from '@react-three/drei'
import { useUIStore } from '../../store/useUIStore'

export function GridFloor() {
  const showGrid = useUIStore((s) => s.showGrid)

  if (!showGrid) return null

  return (
    <Grid
      args={[10, 10]}
      cellSize={0.5}
      cellThickness={0.5}
      cellColor="#1a1a2e"
      sectionSize={2}
      sectionThickness={1}
      sectionColor="#2a2a4e"
      fadeDistance={20}
      infiniteGrid
      position={[0, 0, 0]}
    />
  )
}
