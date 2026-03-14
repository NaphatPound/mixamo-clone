import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  activePanel: string | null
  showWeightViz: boolean
  showSkeleton: boolean
  showGrid: boolean
  toggleSidebar: () => void
  setActivePanel: (panel: string | null) => void
  toggleWeightViz: () => void
  toggleSkeleton: () => void
  toggleGrid: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activePanel: 'import',
  showWeightViz: false,
  showSkeleton: true,
  showGrid: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActivePanel: (activePanel) => set({ activePanel }),
  toggleWeightViz: () => set((state) => ({ showWeightViz: !state.showWeightViz })),
  toggleSkeleton: () => set((state) => ({ showSkeleton: !state.showSkeleton })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
}))
