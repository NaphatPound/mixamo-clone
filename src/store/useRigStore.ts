import { create } from 'zustand'
import * as THREE from 'three'
import type { SkeletonType } from '../utils/constants'

export interface LandmarkData {
  key: string
  label: string
  position: THREE.Vector3
  required: boolean
}

interface RigState {
  selectedTemplate: SkeletonType | null
  landmarks: Map<string, LandmarkData>
  activeLandmarkKey: string | null
  skeleton: THREE.Skeleton | null
  skinnedMesh: THREE.SkinnedMesh | null
  isRigGenerated: boolean
  // Preview state
  previewAnim: string
  previewPlaying: boolean
  previewSpeed: number
  selectTemplate: (type: SkeletonType) => void
  setActiveLandmark: (key: string | null) => void
  setLandmark: (key: string, data: LandmarkData) => void
  removeLandmark: (key: string) => void
  clearLandmarks: () => void
  setSkeleton: (skeleton: THREE.Skeleton) => void
  setSkinnedMesh: (mesh: THREE.SkinnedMesh) => void
  setRigGenerated: (generated: boolean) => void
  setPreviewAnim: (anim: string) => void
  setPreviewPlaying: (playing: boolean) => void
  setPreviewSpeed: (speed: number) => void
  reset: () => void
}

export const useRigStore = create<RigState>((set) => ({
  selectedTemplate: null,
  landmarks: new Map(),
  activeLandmarkKey: null,
  skeleton: null,
  skinnedMesh: null,
  isRigGenerated: false,
  previewAnim: 'tpose',
  previewPlaying: false,
  previewSpeed: 1,
  selectTemplate: (selectedTemplate) => set({ selectedTemplate, landmarks: new Map(), activeLandmarkKey: null, skeleton: null, skinnedMesh: null, isRigGenerated: false }),
  setActiveLandmark: (activeLandmarkKey) => set({ activeLandmarkKey }),
  setLandmark: (key, data) => set((state) => {
    const landmarks = new Map(state.landmarks)
    landmarks.set(key, data)
    return { landmarks }
  }),
  removeLandmark: (key) => set((state) => {
    const landmarks = new Map(state.landmarks)
    landmarks.delete(key)
    return { landmarks }
  }),
  clearLandmarks: () => set({ landmarks: new Map() }),
  setSkeleton: (skeleton) => set({ skeleton }),
  setSkinnedMesh: (skinnedMesh) => set({ skinnedMesh }),
  setRigGenerated: (isRigGenerated) => set({ isRigGenerated }),
  setPreviewAnim: (previewAnim) => set({ previewAnim }),
  setPreviewPlaying: (previewPlaying) => set({ previewPlaying }),
  setPreviewSpeed: (previewSpeed) => set({ previewSpeed }),
  reset: () => set({ selectedTemplate: null, landmarks: new Map(), activeLandmarkKey: null, skeleton: null, skinnedMesh: null, isRigGenerated: false, previewAnim: 'tpose', previewPlaying: false, previewSpeed: 1 }),
}))
