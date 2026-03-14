import * as THREE from 'three'

// FBX export is complex - provide a wrapper that falls back to GLB
// Full FBX binary export would require a dedicated library

export async function exportFBX(
  _scene: THREE.Object3D
): Promise<ArrayBuffer> {
  // FBX export is not natively supported in Three.js
  // For production, integrate a library like fbx-writer
  // For now, we'll throw a clear message
  throw new Error(
    'FBX export is not yet implemented. Please use GLB format for export. ' +
    'GLB files can be imported into Blender, Unity, and Unreal Engine.'
  )
}
