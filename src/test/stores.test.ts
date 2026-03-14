import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'
import { useUIStore } from '../store/useUIStore'
import { useRigStore } from '../store/useRigStore'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentStep: 'import',
      isProcessing: false,
      statusMessage: 'Ready',
    })
  })

  it('initializes with import step', () => {
    expect(useAppStore.getState().currentStep).toBe('import')
  })

  it('can change workflow step', () => {
    useAppStore.getState().setStep('template')
    expect(useAppStore.getState().currentStep).toBe('template')
  })

  it('can set processing state', () => {
    useAppStore.getState().setProcessing(true)
    expect(useAppStore.getState().isProcessing).toBe(true)
  })

  it('can set status message', () => {
    useAppStore.getState().setStatus('Loading...')
    expect(useAppStore.getState().statusMessage).toBe('Loading...')
  })
})

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarOpen: true,
      activePanel: 'import',
      showWeightViz: false,
      showSkeleton: true,
      showGrid: true,
    })
  })

  it('initializes with sidebar open', () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true)
  })

  it('can toggle sidebar', () => {
    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().sidebarOpen).toBe(false)
    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().sidebarOpen).toBe(true)
  })

  it('can toggle grid visibility', () => {
    useUIStore.getState().toggleGrid()
    expect(useUIStore.getState().showGrid).toBe(false)
  })

  it('can toggle skeleton visibility', () => {
    useUIStore.getState().toggleSkeleton()
    expect(useUIStore.getState().showSkeleton).toBe(false)
  })

  it('can set active panel', () => {
    useUIStore.getState().setActivePanel('rig')
    expect(useUIStore.getState().activePanel).toBe('rig')
  })
})

describe('useRigStore - landmarks', () => {
  beforeEach(() => {
    useRigStore.getState().reset()
  })

  it('initializes with no active landmark', () => {
    expect(useRigStore.getState().activeLandmarkKey).toBeNull()
  })

  it('can set active landmark', () => {
    useRigStore.getState().setActiveLandmark('hips')
    expect(useRigStore.getState().activeLandmarkKey).toBe('hips')
  })

  it('can place a landmark', () => {
    useRigStore.getState().setLandmark('hips', {
      key: 'hips',
      label: 'Hips',
      position: new THREE.Vector3(0, 1, 0),
      required: true,
    })
    expect(useRigStore.getState().landmarks.has('hips')).toBe(true)
    expect(useRigStore.getState().landmarks.get('hips')!.position.y).toBe(1)
  })

  it('can remove a landmark', () => {
    useRigStore.getState().setLandmark('hips', {
      key: 'hips',
      label: 'Hips',
      position: new THREE.Vector3(0, 1, 0),
      required: true,
    })
    useRigStore.getState().removeLandmark('hips')
    expect(useRigStore.getState().landmarks.has('hips')).toBe(false)
  })

  it('clears landmarks and active key when selecting template', () => {
    useRigStore.getState().setActiveLandmark('hips')
    useRigStore.getState().setLandmark('hips', {
      key: 'hips',
      label: 'Hips',
      position: new THREE.Vector3(0, 1, 0),
      required: true,
    })
    useRigStore.getState().selectTemplate('quadruped')
    expect(useRigStore.getState().landmarks.size).toBe(0)
    expect(useRigStore.getState().activeLandmarkKey).toBeNull()
  })

  it('resets all state', () => {
    useRigStore.getState().selectTemplate('humanoid')
    useRigStore.getState().setActiveLandmark('hips')
    useRigStore.getState().reset()
    expect(useRigStore.getState().selectedTemplate).toBeNull()
    expect(useRigStore.getState().activeLandmarkKey).toBeNull()
    expect(useRigStore.getState().landmarks.size).toBe(0)
  })
})
