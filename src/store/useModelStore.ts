import { create } from 'zustand'
import * as THREE from 'three'

interface ModelState {
  model: THREE.Object3D | null
  fileName: string | null
  boundingBox: THREE.Box3 | null
  wireframe: boolean
  setModel: (model: THREE.Object3D, fileName: string) => void
  clearModel: () => void
  toggleWireframe: () => void
  setBoundingBox: (box: THREE.Box3) => void
}

export const useModelStore = create<ModelState>((set) => ({
  model: null,
  fileName: null,
  boundingBox: null,
  wireframe: false,
  setModel: (model, fileName) => set({ model, fileName }),
  clearModel: () => set({ model: null, fileName: null, boundingBox: null }),
  toggleWireframe: () => set((state) => ({ wireframe: !state.wireframe })),
  setBoundingBox: (boundingBox) => set({ boundingBox }),
}))
