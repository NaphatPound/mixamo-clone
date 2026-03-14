import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useRigStore } from '../../store/useRigStore'
import { Button } from '../UI/Button'
import { Slider } from '../UI/Slider'
import { Select } from '../UI/Select'
import { testAnimations } from '../../core/preview/TestAnimations'

export function PreviewPanel() {
  const setStep = useAppStore((s) => s.setStep)
  const selectedTemplate = useRigStore((s) => s.selectedTemplate)
  const selectedAnim = useRigStore((s) => s.previewAnim)
  const setSelectedAnim = useRigStore((s) => s.setPreviewAnim)
  const isPlaying = useRigStore((s) => s.previewPlaying)
  const setIsPlaying = useRigStore((s) => s.setPreviewPlaying)
  const speed = useRigStore((s) => s.previewSpeed)
  const setSpeed = useRigStore((s) => s.setPreviewSpeed)

  const animOptions = Object.entries(testAnimations)
    .filter(([key]) => {
      if (selectedTemplate === 'quadruped') return ['rest', 'walkCycle', 'tailWag', 'bendTest'].includes(key)
      if (selectedTemplate === 'bird') return ['rest', 'wingFlap', 'walkCycle', 'bendTest'].includes(key)
      return ['tpose', 'wave', 'walkCycle', 'bendTest'].includes(key)
    })
    .map(([key, anim]) => ({ value: key, label: anim.name }))

  return (
    <div>
      <div className="panel-section">
        <div className="panel-title">Animation Preview</div>
        <Select
          value={selectedAnim}
          options={animOptions}
          onChange={(val) => {
            setIsPlaying(false)
            setSelectedAnim(val)
          }}
        />
      </div>

      <div className="panel-section">
        <div className="panel-title">Playback</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <Button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </Button>
          <Button onClick={() => setIsPlaying(false)}>⏹ Stop</Button>
        </div>
        <Slider
          label="Speed"
          value={speed}
          min={0.1}
          max={3}
          step={0.1}
          onChange={setSpeed}
        />
      </div>

      <div className="panel-section" style={{ display: 'flex', gap: '8px' }}>
        <Button onClick={() => {
          setIsPlaying(false)
          setStep('rig')
        }}>← Back</Button>
        <Button
          variant="primary"
          onClick={() => {
            setIsPlaying(false)
            setStep('export')
          }}
          style={{ flex: 1 }}
        >
          Next: Export →
        </Button>
      </div>
    </div>
  )
}
