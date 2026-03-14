import React from 'react'
import { useAppStore, type WorkflowStep } from '../../store/useAppStore'

const steps: { key: WorkflowStep; label: string }[] = [
  { key: 'import', label: 'Import' },
  { key: 'template', label: 'Template' },
  { key: 'landmarks', label: 'Landmarks' },
  { key: 'rig', label: 'Rig' },
  { key: 'preview', label: 'Preview' },
  { key: 'export', label: 'Export' },
]

export function Header() {
  const currentStep = useAppStore((s) => s.currentStep)
  const setStep = useAppStore((s) => s.setStep)

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '16px',
      zIndex: 10,
    }}>
      <div style={{
        fontWeight: 700,
        fontSize: '14px',
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginRight: '16px',
      }}>
        Auto-Rig 3D
      </div>

      <div className="stepper">
        {steps.map((step, i) => (
          <React.Fragment key={step.key}>
            {i > 0 && <div className="step-divider" />}
            <div
              className={`step ${currentStep === step.key ? 'active' : ''} ${
                steps.findIndex((s) => s.key === currentStep) > i ? 'completed' : ''
              }`}
              onClick={() => setStep(step.key)}
            >
              <span>{i + 1}.</span>
              {step.label}
            </div>
          </React.Fragment>
        ))}
      </div>
    </header>
  )
}
