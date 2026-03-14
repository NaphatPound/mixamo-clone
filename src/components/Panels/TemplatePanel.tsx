import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useRigStore } from '../../store/useRigStore'
import { Button } from '../UI/Button'
import type { SkeletonType } from '../../utils/constants'
import { humanoidTemplate } from '../../core/skeleton/HumanoidTemplate'
import { quadrupedTemplate } from '../../core/skeleton/QuadrupedTemplate'
import { birdTemplate } from '../../core/skeleton/BirdTemplate'

const templates: { type: SkeletonType; icon: string; name: string; bones: number }[] = [
  { type: 'humanoid', icon: '🧍', name: 'Humanoid', bones: humanoidTemplate.bones.length },
  { type: 'quadruped', icon: '🐕', name: 'Quadruped', bones: quadrupedTemplate.bones.length },
  { type: 'bird', icon: '🐦', name: 'Bird', bones: birdTemplate.bones.length },
  { type: 'custom', icon: '⚙️', name: 'Custom', bones: 0 },
]

export function TemplatePanel() {
  const setStep = useAppStore((s) => s.setStep)
  const selectedTemplate = useRigStore((s) => s.selectedTemplate)
  const selectTemplate = useRigStore((s) => s.selectTemplate)

  return (
    <div>
      <div className="panel-section">
        <div className="panel-title">Skeleton Template</div>
        <div className="template-grid">
          {templates.map((t) => (
            <div
              key={t.type}
              className={`template-card ${selectedTemplate === t.type ? 'selected' : ''}`}
              onClick={() => selectTemplate(t.type)}
            >
              <div className="template-icon">{t.icon}</div>
              <div className="template-name">{t.name}</div>
              <div className="template-bones">{t.bones > 0 ? `${t.bones} bones` : 'Build your own'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section" style={{ display: 'flex', gap: '8px' }}>
        <Button onClick={() => setStep('import')}>← Back</Button>
        <Button
          variant="primary"
          disabled={!selectedTemplate}
          onClick={() => setStep('landmarks')}
          style={{ flex: 1 }}
        >
          Next: Place Landmarks →
        </Button>
      </div>
    </div>
  )
}
