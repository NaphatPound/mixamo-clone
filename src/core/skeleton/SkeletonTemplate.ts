export interface BoneDefinition {
  name: string
  parent: string | null
  defaultLocalPosition: [number, number, number]
  landmarkKey?: string
  constraints?: {
    rotationMin?: [number, number, number]
    rotationMax?: [number, number, number]
  }
}

export interface LandmarkDefinition {
  key: string
  label: string
  description: string
  color: string
}

export interface SkeletonTemplate {
  id: string
  name: string
  type: 'humanoid' | 'quadruped' | 'bird' | 'custom'
  bones: BoneDefinition[]
  requiredLandmarks: LandmarkDefinition[]
  optionalLandmarks: LandmarkDefinition[]
  testAnimations: string[]
}
