import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'

export type SupportedFormat = 'glb' | 'gltf' | 'fbx' | 'obj'

function detectFormat(fileName: string): SupportedFormat {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'glb':
    case 'gltf':
      return 'glb'
    case 'fbx':
      return 'fbx'
    case 'obj':
      return 'obj'
    default:
      throw new Error(`Unsupported format: ${ext}`)
  }
}

export async function loadModel(file: File): Promise<THREE.Object3D> {
  const format = detectFormat(file.name)
  const url = URL.createObjectURL(file)

  try {
    switch (format) {
      case 'glb':
        return await loadGLTF(url)
      case 'fbx':
        return await loadFBX(url)
      case 'obj':
        return await loadOBJ(url)
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadGLTF(url: string): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject)
  })
}

function loadFBX(url: string): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    const loader = new FBXLoader()
    loader.load(url, (object) => resolve(object), undefined, reject)
  })
}

function loadOBJ(url: string): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    const loader = new OBJLoader()
    loader.load(url, (object) => resolve(object), undefined, reject)
  })
}
