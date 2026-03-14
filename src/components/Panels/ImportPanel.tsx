import React, { useCallback, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useModelStore } from '../../store/useModelStore'
import { loadModel } from '../../core/loader/ModelLoader'
import { prepareModel } from '../../core/loader/MeshAnalyzer'
import { showToast } from '../UI/Toast'
import { Button } from '../UI/Button'
import { SUPPORTED_FORMATS } from '../../utils/constants'

export function ImportPanel() {
  const setStep = useAppStore((s) => s.setStep)
  const setProcessing = useAppStore((s) => s.setProcessing)
  const setStatus = useAppStore((s) => s.setStatus)
  const setModel = useModelStore((s) => s.setModel)
  const setBoundingBox = useModelStore((s) => s.setBoundingBox)
  const fileName = useModelStore((s) => s.fileName)
  const model = useModelStore((s) => s.model)
  const [dragOver, setDragOver] = useState(false)
  const [modelInfo, setModelInfo] = useState<{ vertices: number; faces: number; meshes: number } | null>(null)

  const handleFile = useCallback(async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!SUPPORTED_FORMATS.includes(ext as any)) {
      showToast(`Unsupported format: ${ext}. Use GLB, FBX, or OBJ.`, 'error')
      return
    }

    setProcessing(true)
    setStatus(`Loading ${file.name}...`)

    try {
      const loaded = await loadModel(file)
      const analysis = prepareModel(loaded)
      setModel(loaded, file.name)
      setBoundingBox(analysis.boundingBox)
      setModelInfo({ vertices: analysis.vertexCount, faces: analysis.faceCount, meshes: analysis.meshCount })
      setStatus('Model loaded')
      showToast(`Loaded ${file.name}`, 'success')
    } catch (err) {
      showToast(`Failed to load model: ${(err as Error).message}`, 'error')
      setStatus('Load failed')
    } finally {
      setProcessing(false)
    }
  }, [setModel, setBoundingBox, setProcessing, setStatus])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div>
      <div className="panel-section">
        <div className="panel-title">Import Model</div>
        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="drop-zone-icon">📦</div>
          <div className="drop-zone-text">
            {fileName || 'Drop 3D model here or click to browse'}
          </div>
          <div className="drop-zone-hint">Supports GLB, FBX, OBJ</div>
          <input
            id="file-input"
            type="file"
            accept=".glb,.gltf,.fbx,.obj"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>
      </div>

      {modelInfo && (
        <div className="panel-section">
          <div className="panel-title">Model Info</div>
          <div className="panel-row">
            <span className="panel-label">Vertices</span>
            <span className="panel-value">{modelInfo.vertices.toLocaleString()}</span>
          </div>
          <div className="panel-row">
            <span className="panel-label">Faces</span>
            <span className="panel-value">{modelInfo.faces.toLocaleString()}</span>
          </div>
          <div className="panel-row">
            <span className="panel-label">Meshes</span>
            <span className="panel-value">{modelInfo.meshes}</span>
          </div>
        </div>
      )}

      {model && (
        <div className="panel-section">
          <Button variant="primary" onClick={() => setStep('template')} style={{ width: '100%' }}>
            Next: Choose Template →
          </Button>
        </div>
      )}
    </div>
  )
}
