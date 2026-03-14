import React, { useState, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useRigStore } from '../../store/useRigStore'
import { Button } from '../UI/Button'
import { showToast } from '../UI/Toast'
import { exportGLTF, downloadFile } from '../../core/export/GLTFExporter'

export function ExportPanel() {
  const setStep = useAppStore((s) => s.setStep)
  const setProcessing = useAppStore((s) => s.setProcessing)
  const setStatus = useAppStore((s) => s.setStatus)
  const skinnedMesh = useRigStore((s) => s.skinnedMesh)
  const [includeAnimations, setIncludeAnimations] = useState(false)

  const handleExportGLB = useCallback(async () => {
    if (!skinnedMesh) {
      showToast('No rigged model to export', 'error')
      return
    }

    setProcessing(true)
    setStatus('Exporting GLB...')

    try {
      const data = await exportGLTF(skinnedMesh, {
        binary: true,
        includeAnimations,
      })
      downloadFile(data, 'rigged-model.glb')
      showToast('Exported rigged-model.glb', 'success')
      setStatus('Export complete')
    } catch (err) {
      showToast(`Export failed: ${(err as Error).message}`, 'error')
      setStatus('Export failed')
    } finally {
      setProcessing(false)
    }
  }, [skinnedMesh, includeAnimations, setProcessing, setStatus])

  return (
    <div>
      <div className="panel-section">
        <div className="panel-title">Export Options</div>

        <label className="panel-row" style={{ cursor: 'pointer' }}>
          <span className="panel-label">Include animations</span>
          <input
            type="checkbox"
            checked={includeAnimations}
            onChange={(e) => setIncludeAnimations(e.target.checked)}
          />
        </label>
      </div>

      <div className="panel-section">
        <div className="panel-title">Download</div>
        <Button
          variant="accent"
          onClick={handleExportGLB}
          disabled={!skinnedMesh}
          style={{ width: '100%', marginBottom: '8px' }}
        >
          Export as GLB
        </Button>
        <Button
          disabled
          style={{ width: '100%' }}
        >
          Export as FBX (Coming Soon)
        </Button>
      </div>

      <div className="panel-section">
        <Button onClick={() => setStep('preview')}>← Back</Button>
      </div>
    </div>
  )
}
