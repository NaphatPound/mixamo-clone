import React, { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useRigStore } from '../../store/useRigStore'
import { Button } from '../UI/Button'
import { humanoidTemplate } from '../../core/skeleton/HumanoidTemplate'
import { quadrupedTemplate } from '../../core/skeleton/QuadrupedTemplate'
import { birdTemplate } from '../../core/skeleton/BirdTemplate'
import type { SkeletonTemplate } from '../../core/skeleton/SkeletonTemplate'

function getTemplate(type: string | null): SkeletonTemplate | null {
  switch (type) {
    case 'humanoid': return humanoidTemplate
    case 'quadruped': return quadrupedTemplate
    case 'bird': return birdTemplate
    default: return null
  }
}

export function MarkerPanel() {
  const setStep = useAppStore((s) => s.setStep)
  const selectedTemplate = useRigStore((s) => s.selectedTemplate)
  const landmarks = useRigStore((s) => s.landmarks)
  const activeLandmarkKey = useRigStore((s) => s.activeLandmarkKey)
  const setActiveLandmark = useRigStore((s) => s.setActiveLandmark)
  const removeLandmark = useRigStore((s) => s.removeLandmark)

  const template = getTemplate(selectedTemplate)
  const placedKeys = useMemo(() => new Set(landmarks.keys()), [landmarks])

  const requiredLandmarks = template?.requiredLandmarks ?? []
  const optionalLandmarks = template?.optionalLandmarks ?? []
  const requiredPlaced = requiredLandmarks.filter((l) => placedKeys.has(l.key)).length
  const allRequiredPlaced = requiredPlaced === requiredLandmarks.length

  // Auto-select first unplaced landmark when entering this step
  React.useEffect(() => {
    if (!activeLandmarkKey && requiredLandmarks.length > 0) {
      const first = requiredLandmarks.find((l) => !placedKeys.has(l.key))
      if (first) setActiveLandmark(first.key)
    }
  }, [activeLandmarkKey, requiredLandmarks, placedKeys, setActiveLandmark])

  const handleLandmarkClick = (key: string) => {
    if (activeLandmarkKey === key) {
      // Toggle off
      setActiveLandmark(null)
    } else {
      setActiveLandmark(key)
    }
  }

  const handleRemoveLandmark = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeLandmark(key)
    setActiveLandmark(key) // Re-select so user can re-place it
  }

  return (
    <div>
      <div className="panel-section">
        <div className="panel-title">Landmark Markers</div>
        <div className="panel-row">
          <span className="panel-label">Progress</span>
          <span className="panel-value">{requiredPlaced}/{requiredLandmarks.length}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${requiredLandmarks.length > 0 ? (requiredPlaced / requiredLandmarks.length) * 100 : 0}%` }} />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          {activeLandmarkKey
            ? `Click on the model to place: ${template?.requiredLandmarks.find((l) => l.key === activeLandmarkKey)?.label ?? template?.optionalLandmarks.find((l) => l.key === activeLandmarkKey)?.label ?? activeLandmarkKey}`
            : 'Select a landmark below, then click on the model'}
        </p>
      </div>

      <div className="panel-section">
        <div className="panel-title">Required</div>
        {requiredLandmarks.map((l) => (
          <div
            key={l.key}
            className="landmark-item"
            onClick={() => handleLandmarkClick(l.key)}
            style={{
              background: activeLandmarkKey === l.key ? 'var(--bg-active)' : undefined,
              border: activeLandmarkKey === l.key ? '1px solid var(--accent)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div className="landmark-dot" style={{ background: l.color }} />
            <span className="landmark-name">{l.label}</span>
            {placedKeys.has(l.key) ? (
              <>
                <span className="landmark-status placed">Placed</span>
                <button
                  className="btn btn-sm btn-danger"
                  style={{ padding: '1px 6px', fontSize: '10px', marginLeft: '4px' }}
                  onClick={(e) => handleRemoveLandmark(l.key, e)}
                >
                  ✕
                </button>
              </>
            ) : (
              <span className="landmark-status required">
                {activeLandmarkKey === l.key ? 'Active' : 'Required'}
              </span>
            )}
          </div>
        ))}
      </div>

      {optionalLandmarks.length > 0 && (
        <div className="panel-section">
          <div className="panel-title">Optional</div>
          {optionalLandmarks.map((l) => (
            <div
              key={l.key}
              className="landmark-item"
              onClick={() => handleLandmarkClick(l.key)}
              style={{
                background: activeLandmarkKey === l.key ? 'var(--bg-active)' : undefined,
                border: activeLandmarkKey === l.key ? '1px solid var(--accent)' : '1px solid transparent',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div className="landmark-dot" style={{ background: l.color }} />
              <span className="landmark-name">{l.label}</span>
              {placedKeys.has(l.key) ? (
                <>
                  <span className="landmark-status placed">Placed</span>
                  <button
                    className="btn btn-sm btn-danger"
                    style={{ padding: '1px 6px', fontSize: '10px', marginLeft: '4px' }}
                    onClick={(e) => handleRemoveLandmark(l.key, e)}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span className="landmark-status optional">
                  {activeLandmarkKey === l.key ? 'Active' : 'Optional'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="panel-section" style={{ display: 'flex', gap: '8px' }}>
        <Button onClick={() => setStep('template')}>← Back</Button>
        <Button
          variant="primary"
          disabled={!allRequiredPlaced && requiredLandmarks.length > 0}
          onClick={() => setStep('rig')}
          style={{ flex: 1 }}
        >
          Next: Generate Rig →
        </Button>
      </div>
    </div>
  )
}
