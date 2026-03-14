import * as THREE from 'three'
import { GLTFExporter as ThreeGLTFExporter } from 'three/addons/exporters/GLTFExporter.js'

export interface ExportOptions {
  binary: boolean
  includeAnimations: boolean
  animations?: THREE.AnimationClip[]
}

export async function exportGLTF(
  scene: THREE.Object3D,
  options: ExportOptions = { binary: true, includeAnimations: false }
): Promise<ArrayBuffer | string> {
  const exporter = new ThreeGLTFExporter()

  return new Promise((resolve, reject) => {
    const exportOptions: Record<string, unknown> = {
      binary: options.binary,
    }

    if (options.includeAnimations && options.animations) {
      exportOptions.animations = options.animations
    }

    exporter.parse(
      scene,
      (result) => resolve(result as ArrayBuffer | string),
      (error) => reject(error),
      exportOptions
    )
  })
}

export function downloadFile(data: ArrayBuffer | string, fileName: string): void {
  let blob: Blob
  if (data instanceof ArrayBuffer) {
    blob = new Blob([data], { type: 'application/octet-stream' })
  } else {
    blob = new Blob([data], { type: 'application/json' })
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
