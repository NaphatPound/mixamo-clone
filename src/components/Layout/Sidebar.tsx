import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { ImportPanel } from '../Panels/ImportPanel'
import { TemplatePanel } from '../Panels/TemplatePanel'
import { MarkerPanel } from '../Panels/MarkerPanel'
import { RigPanel } from '../Panels/RigPanel'
import { PreviewPanel } from '../Panels/PreviewPanel'
import { ExportPanel } from '../Panels/ExportPanel'

export function Sidebar() {
  const currentStep = useAppStore((s) => s.currentStep)

  const renderPanel = () => {
    switch (currentStep) {
      case 'import': return <ImportPanel />
      case 'template': return <TemplatePanel />
      case 'landmarks': return <MarkerPanel />
      case 'rig': return <RigPanel />
      case 'preview': return <PreviewPanel />
      case 'export': return <ExportPanel />
    }
  }

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minWidth: 'var(--sidebar-width)',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {renderPanel()}
    </aside>
  )
}
