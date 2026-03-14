export const APP_NAME = 'Auto-Rig 3D'

export const SUPPORTED_FORMATS = ['.glb', '.gltf', '.fbx', '.obj'] as const

export const DEFAULT_VOXEL_RESOLUTION = 48

export const MAX_BONE_INFLUENCES = 4

export const HEAT_DIFFUSION_ITERATIONS = 80

export const WEIGHT_THRESHOLD = 0.005

export const COLORS = {
  accent: '#00d4ff',
  accentSecondary: '#a855f7',
  bone: '#ffcc00',
  marker: '#ff4488',
  markerOptional: '#44aaff',
  markerPlaced: '#44ff88',
  weightHot: '#ff0000',
  weightCold: '#0000ff',
  grid: '#333333',
} as const

export const SKELETON_TYPES = ['humanoid', 'quadruped', 'bird', 'custom'] as const
export type SkeletonType = (typeof SKELETON_TYPES)[number]
