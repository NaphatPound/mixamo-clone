import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useModelStore } from '../../store/useModelStore'
import { useRigStore } from '../../store/useRigStore'

export function StatusBar() {
  const statusMessage = useAppStore((s) => s.statusMessage)
  const isProcessing = useAppStore((s) => s.isProcessing)
  const fileName = useModelStore((s) => s.fileName)
  const selectedTemplate = useRigStore((s) => s.selectedTemplate)
  const isRigGenerated = useRigStore((s) => s.isRigGenerated)

  return (
    <footer style={{
      height: 'var(--statusbar-height)',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      fontSize: '11px',
      color: 'var(--text-secondary)',
      gap: '16px',
    }}>
      <span style={{ color: isProcessing ? 'var(--accent)' : 'var(--text-secondary)' }}>
        {isProcessing ? '⟳ ' : ''}{statusMessage}
      </span>
      <span style={{ marginLeft: 'auto' }}>
        {fileName && `Model: ${fileName}`}
        {selectedTemplate && ` | Template: ${selectedTemplate}`}
        {isRigGenerated && ' | Rig: Ready'}
      </span>
    </footer>
  )
}
