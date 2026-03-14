import * as THREE from 'three'

export type AnimationType = 'tpose' | 'wave' | 'walkCycle' | 'bendTest' | 'tailWag' | 'wingFlap' | 'rest'

export interface TestAnimation {
  name: string
  type: AnimationType
  duration: number
  createClip: (bones: THREE.Bone[]) => THREE.AnimationClip
}

function findBone(bones: THREE.Bone[], name: string): THREE.Bone | undefined {
  return bones.find((b) => b.name === name)
}

function createRotationTrack(
  boneName: string,
  times: number[],
  quaternions: number[]
): THREE.QuaternionKeyframeTrack {
  return new THREE.QuaternionKeyframeTrack(
    `${boneName}.quaternion`,
    times,
    quaternions
  )
}

export const testAnimations: Record<string, TestAnimation> = {
  tpose: {
    name: 'T-Pose',
    type: 'tpose',
    duration: 1,
    createClip: (bones) => {
      const tracks: THREE.KeyframeTrack[] = []
      const identity = new THREE.Quaternion()
      for (const bone of bones) {
        tracks.push(
          createRotationTrack(bone.name, [0, 1], [
            identity.x, identity.y, identity.z, identity.w,
            identity.x, identity.y, identity.z, identity.w,
          ])
        )
      }
      return new THREE.AnimationClip('T-Pose', 1, tracks)
    },
  },

  wave: {
    name: 'Wave',
    type: 'wave',
    duration: 2,
    createClip: (bones) => {
      const tracks: THREE.KeyframeTrack[] = []
      const rightUpperArm = findBone(bones, 'RightUpperArm')
      const rightLowerArm = findBone(bones, 'RightLowerArm')

      if (rightUpperArm) {
        const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI * 0.8))
        const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI * 0.6))
        tracks.push(createRotationTrack(rightUpperArm.name, [0, 0.5, 1, 1.5, 2], [
          q1.x, q1.y, q1.z, q1.w,
          q2.x, q2.y, q2.z, q2.w,
          q1.x, q1.y, q1.z, q1.w,
          q2.x, q2.y, q2.z, q2.w,
          q1.x, q1.y, q1.z, q1.w,
        ]))
      }

      if (rightLowerArm) {
        const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.3, 0))
        const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.3, 0))
        tracks.push(createRotationTrack(rightLowerArm.name, [0, 0.5, 1, 1.5, 2], [
          q1.x, q1.y, q1.z, q1.w,
          q2.x, q2.y, q2.z, q2.w,
          q1.x, q1.y, q1.z, q1.w,
          q2.x, q2.y, q2.z, q2.w,
          q1.x, q1.y, q1.z, q1.w,
        ]))
      }

      return new THREE.AnimationClip('Wave', 2, tracks)
    },
  },

  walkCycle: {
    name: 'Walk Cycle',
    type: 'walkCycle',
    duration: 2,
    createClip: (bones) => {
      const tracks: THREE.KeyframeTrack[] = []
      const leftUpperLeg = findBone(bones, 'LeftUpperLeg')
      const rightUpperLeg = findBone(bones, 'RightUpperLeg')
      const leftLowerLeg = findBone(bones, 'LeftLowerLeg')
      const rightLowerLeg = findBone(bones, 'RightLowerLeg')

      const fwd = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0))
      const back = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, 0, 0))
      const neutral = new THREE.Quaternion()
      const knBend = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.6, 0, 0))

      if (leftUpperLeg) {
        tracks.push(createRotationTrack(leftUpperLeg.name, [0, 0.5, 1, 1.5, 2], [
          fwd.x, fwd.y, fwd.z, fwd.w,
          neutral.x, neutral.y, neutral.z, neutral.w,
          back.x, back.y, back.z, back.w,
          neutral.x, neutral.y, neutral.z, neutral.w,
          fwd.x, fwd.y, fwd.z, fwd.w,
        ]))
      }
      if (rightUpperLeg) {
        tracks.push(createRotationTrack(rightUpperLeg.name, [0, 0.5, 1, 1.5, 2], [
          back.x, back.y, back.z, back.w,
          neutral.x, neutral.y, neutral.z, neutral.w,
          fwd.x, fwd.y, fwd.z, fwd.w,
          neutral.x, neutral.y, neutral.z, neutral.w,
          back.x, back.y, back.z, back.w,
        ]))
      }
      if (leftLowerLeg) {
        tracks.push(createRotationTrack(leftLowerLeg.name, [0, 0.5, 1, 1.5, 2], [
          knBend.x, knBend.y, knBend.z, knBend.w,
          neutral.x, neutral.y, neutral.z, neutral.w,
          neutral.x, neutral.y, neutral.z, neutral.w,
          knBend.x, knBend.y, knBend.z, knBend.w,
          knBend.x, knBend.y, knBend.z, knBend.w,
        ]))
      }
      if (rightLowerLeg) {
        tracks.push(createRotationTrack(rightLowerLeg.name, [0, 0.5, 1, 1.5, 2], [
          neutral.x, neutral.y, neutral.z, neutral.w,
          knBend.x, knBend.y, knBend.z, knBend.w,
          knBend.x, knBend.y, knBend.z, knBend.w,
          neutral.x, neutral.y, neutral.z, neutral.w,
          neutral.x, neutral.y, neutral.z, neutral.w,
        ]))
      }

      return new THREE.AnimationClip('Walk Cycle', 2, tracks)
    },
  },

  bendTest: {
    name: 'Bend Test',
    type: 'bendTest',
    duration: 4,
    createClip: (bones) => {
      const tracks: THREE.KeyframeTrack[] = []
      const identity = new THREE.Quaternion()

      // Rotate each bone slightly in sequence
      const timePerBone = 4 / Math.max(bones.length, 1)
      for (let i = 0; i < bones.length; i++) {
        const start = i * timePerBone
        const mid = start + timePerBone * 0.5
        const end = start + timePerBone
        const bend = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, 0, 0.2))
        tracks.push(createRotationTrack(bones[i].name,
          [Math.max(0, start), mid, Math.min(4, end)],
          [
            identity.x, identity.y, identity.z, identity.w,
            bend.x, bend.y, bend.z, bend.w,
            identity.x, identity.y, identity.z, identity.w,
          ]
        ))
      }

      return new THREE.AnimationClip('Bend Test', 4, tracks)
    },
  },

  tailWag: {
    name: 'Tail Wag',
    type: 'tailWag',
    duration: 1,
    createClip: (bones) => {
      const tracks: THREE.KeyframeTrack[] = []
      const tailBones = bones.filter((b) => b.name.startsWith('Tail'))

      for (let i = 0; i < tailBones.length; i++) {
        const amplitude = 0.3 + i * 0.15
        const left = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, amplitude, 0))
        const right = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -amplitude, 0))
        tracks.push(createRotationTrack(tailBones[i].name, [0, 0.25, 0.5, 0.75, 1], [
          left.x, left.y, left.z, left.w,
          right.x, right.y, right.z, right.w,
          left.x, left.y, left.z, left.w,
          right.x, right.y, right.z, right.w,
          left.x, left.y, left.z, left.w,
        ]))
      }

      return new THREE.AnimationClip('Tail Wag', 1, tracks)
    },
  },

  wingFlap: {
    name: 'Wing Flap',
    type: 'wingFlap',
    duration: 1.5,
    createClip: (bones) => {
      const tracks: THREE.KeyframeTrack[] = []
      const wingBones = bones.filter((b) => b.name.includes('Wing'))

      for (const bone of wingBones) {
        const isLeft = bone.name.includes('Left')
        const dir = isLeft ? 1 : -1
        const up = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, dir * 0.5))
        const down = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, dir * -0.3))
        tracks.push(createRotationTrack(bone.name, [0, 0.375, 0.75, 1.125, 1.5], [
          down.x, down.y, down.z, down.w,
          up.x, up.y, up.z, up.w,
          down.x, down.y, down.z, down.w,
          up.x, up.y, up.z, up.w,
          down.x, down.y, down.z, down.w,
        ]))
      }

      return new THREE.AnimationClip('Wing Flap', 1.5, tracks)
    },
  },

  rest: {
    name: 'Rest Pose',
    type: 'rest',
    duration: 1,
    createClip: (bones) => {
      const tracks: THREE.KeyframeTrack[] = []
      const identity = new THREE.Quaternion()
      for (const bone of bones) {
        tracks.push(
          createRotationTrack(bone.name, [0], [
            identity.x, identity.y, identity.z, identity.w,
          ])
        )
      }
      return new THREE.AnimationClip('Rest', 1, tracks)
    },
  },
}
