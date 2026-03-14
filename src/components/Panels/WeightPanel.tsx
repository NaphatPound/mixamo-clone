import React from 'react'
import { useUIStore } from '../../store/useUIStore'
import { Button } from '../UI/Button'

export function WeightPanel() {
  const showWeightViz = useUIStore((s) => s.showWeightViz)
  const toggleWeightViz = useUIStore((s) => s.toggleWeightViz)

  return (
    <div className="panel-section">
      <div className="panel-title">Weight Visualization</div>
      <Button
        variant={showWeightViz ? 'primary' : 'default'}
        onClick={toggleWeightViz}
        style={{ width: '100%' }}
      >
        {showWeightViz ? 'Hide Weight Map' : 'Show Weight Map'}
      </Button>
    </div>
  )
}
