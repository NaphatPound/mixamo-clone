import React, { useCallback, useState } from 'react'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore'
import { useModelStore } from '../../store/useModelStore'
import { useRigStore } from '../../store/useRigStore'
import { Button } from '../UI/Button'
import { showToast } from '../UI/Toast'
import { humanoidTemplate } from '../../core/skeleton/HumanoidTemplate'
import { quadrupedTemplate } from '../../core/skeleton/QuadrupedTemplate'
import { birdTemplate } from '../../core/skeleton/BirdTemplate'
import { fitTemplateToBones } from '../../core/skeleton/TemplateFitter'
import { buildSkeleton, getSkeletonInfo } from '../../core/rigging/SkeletonBuilder'
import { collectBones } from '../../core/rigging/BoneGenerator'
import { VoxelGrid } from '../../core/skinning/VoxelGrid'
import { computeHeatWeights, vertexWeightsFromVoxels } from '../../core/skinning/HeatDiffusion'
import { smoothWeights } from '../../core/skinning/WeightSmooth'
import { bindSkin } from '../../core/skinning/SkinBinder'
import type { SkeletonTemplate } from '../../core/skeleton/SkeletonTemplate'

function getTemplate(type: string | null): SkeletonTemplate | null {
  switch (type) {
    case 'humanoid': return humanoidTemplate
    case 'quadruped': return quadrupedTemplate
    case 'bird': return birdTemplate
    default: return null
  }
}

export function RigPanel() {
  const setStep = useAppStore((s) => s.setStep)
  const setProcessing = useAppStore((s) => s.setProcessing)
  const setStatus = useAppStore((s) => s.setStatus)
  const model = useModelStore((s) => s.model)
  const selectedTemplate = useRigStore((s) => s.selectedTemplate)
  const isRigGenerated = useRigStore((s) => s.isRigGenerated)
  const skeleton = useRigStore((s) => s.skeleton)

  // Use local state for progress to avoid Zustand re-render loops
  const [progress, setProgress] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateRig = useCallback(async () => {
    const template = getTemplate(selectedTemplate)
    if (!template || !model) return

    setIsGenerating(true)
    setProcessing(true)
    setStatus('Generating rig...')
    setProgress(0)

    try {
      // Step 1: Fit template to landmarks
      setStatus('Fitting skeleton...')
      setProgress(0.1)
      const landmarkPositions = new Map<string, THREE.Vector3>()
      // Read landmarks directly from store to avoid stale closure
      const currentLandmarks = useRigStore.getState().landmarks
      currentLandmarks.forEach((data, key) => {
        landmarkPositions.set(key, data.position)
      })
      const rootBone = fitTemplateToBones(template, landmarkPositions)
      const skel = buildSkeleton(rootBone)
      setProgress(0.3)

      // Step 2: Voxelize mesh
      setStatus('Voxelizing mesh...')
      await new Promise((r) => setTimeout(r, 0))
      const boundingBox = new THREE.Box3().setFromObject(model)
      const voxelGrid = new VoxelGrid(boundingBox, 32)
      // Find first mesh and its geometry
      let foundMesh: THREE.Mesh | null = null
      model.traverse((child) => {
        if (!foundMesh && child instanceof THREE.Mesh) foundMesh = child
      })

      if (!foundMesh) {
        throw new Error('No mesh found in model')
      }
      const targetMesh: THREE.Mesh = foundMesh

      // Use the mesh's own world matrix to correctly
      // transform local-space vertices to world space
      targetMesh.updateWorldMatrix(true, false)
      const meshWorldMatrix = targetMesh.matrixWorld.clone()

      const geometry = targetMesh.geometry
      voxelGrid.voxelizeMesh(geometry, meshWorldMatrix)
      console.log('[Rig] Solid voxels after voxelization:', voxelGrid.getSolidCount(), '/', voxelGrid.totalVoxels)

      setProgress(0.5)

      // Step 3: Compute heat diffusion weights (async with yielding)
      setStatus('Computing skin weights...')
      await new Promise((r) => setTimeout(r, 0))
      const bones = collectBones(rootBone)
      console.log('[Rig] Bones:', bones.length, 'Vertices:', geometry.getAttribute('position').count)
      const boneWeights = await computeHeatWeights(voxelGrid, bones, (p) => {
        setProgress(0.5 + p * 0.3)
      })
      setProgress(0.8)

      // Step 4: Apply weights to mesh
      setStatus('Binding skin...')
      await new Promise((r) => setTimeout(r, 0))
      const positions: THREE.Vector3[] = []
      const posAttr = targetMesh.geometry.getAttribute('position')
      for (let i = 0; i < posAttr.count; i++) {
        positions.push(new THREE.Vector3().fromBufferAttribute(posAttr, i))
      }
      let skinWeights = vertexWeightsFromVoxels(voxelGrid, boneWeights, positions, meshWorldMatrix)
      skinWeights = smoothWeights(skinWeights, targetMesh.geometry)

      // Log weight statistics for debugging
      let zeroWeightCount = 0
      for (let v = 0; v < positions.length; v++) {
        let total = 0
        for (let j = 0; j < 4; j++) total += skinWeights.weights[v * 4 + j]
        if (total < 0.01) zeroWeightCount++
      }
      console.log('[Rig] Zero-weight vertices:', zeroWeightCount, '/', positions.length)

      const skinnedMesh = bindSkin(targetMesh, skel, skinWeights)
      skinnedMesh.updateMatrixWorld(true)
      // Set skeleton and skinnedMesh together to avoid intermediate renders
      useRigStore.getState().setSkeleton(skel)
      useRigStore.getState().setSkinnedMesh(skinnedMesh)

      setProgress(1)
      useRigStore.getState().setRigGenerated(true)
      setStatus('Rig generated successfully')
      showToast('Rig generated!', 'success')
    } catch (err) {
      console.error('Rig generation failed:', err)
      showToast(`Rig generation failed: ${(err as Error).message}`, 'error')
      setStatus('Rig generation failed')
    } finally {
      setProcessing(false)
      setIsGenerating(false)
    }
  }, [model, selectedTemplate, setProcessing, setStatus])

  const info = skeleton ? getSkeletonInfo(skeleton) : null

  return (
    <div>
      <div className="panel-section">
        <div className="panel-title">Generate Rig</div>
        {!isRigGenerated ? (
          <>
            <div className="progress-bar" style={{ marginBottom: '12px' }}>
              <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
            </div>
            <Button
              variant="accent"
              onClick={generateRig}
              disabled={!model || !selectedTemplate || isGenerating}
              style={{ width: '100%' }}
            >
              {isGenerating ? 'Generating...' : 'Generate Rig'}
            </Button>
          </>
        ) : (
          <>
            <div className="panel-row">
              <span className="panel-label">Status</span>
              <span className="panel-value" style={{ color: 'var(--success)' }}>Ready</span>
            </div>
            {info && (
              <>
                <div className="panel-row">
                  <span className="panel-label">Bones</span>
                  <span className="panel-value">{info.boneCount}</span>
                </div>
                <div className="panel-row">
                  <span className="panel-label">Max Depth</span>
                  <span className="panel-value">{info.maxDepth}</span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="panel-section" style={{ display: 'flex', gap: '8px' }}>
        <Button onClick={() => setStep('landmarks')}>← Back</Button>
        <Button
          variant="primary"
          disabled={!isRigGenerated}
          onClick={() => setStep('preview')}
          style={{ flex: 1 }}
        >
          Next: Preview →
        </Button>
      </div>
    </div>
  )
}
