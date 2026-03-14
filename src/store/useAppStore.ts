import { create } from 'zustand'

export type WorkflowStep = 'import' | 'template' | 'landmarks' | 'rig' | 'preview' | 'export'

interface AppState {
  currentStep: WorkflowStep
  isProcessing: boolean
  statusMessage: string
  setStep: (step: WorkflowStep) => void
  setProcessing: (processing: boolean) => void
  setStatus: (message: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentStep: 'import',
  isProcessing: false,
  statusMessage: 'Ready',
  setStep: (step) => set({ currentStep: step }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setStatus: (statusMessage) => set({ statusMessage }),
}))
