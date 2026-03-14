import * as THREE from 'three'

export class AnimationPlayer {
  private mixer: THREE.AnimationMixer
  private currentAction: THREE.AnimationAction | null = null
  private clock: THREE.Clock
  private _isPlaying = false
  private _speed = 1.0

  constructor(root: THREE.Object3D) {
    this.mixer = new THREE.AnimationMixer(root)
    this.clock = new THREE.Clock(false)
  }

  play(clip: THREE.AnimationClip): void {
    if (this.currentAction) {
      this.currentAction.stop()
    }
    this.currentAction = this.mixer.clipAction(clip)
    this.currentAction.setLoop(THREE.LoopRepeat, Infinity)
    this.currentAction.play()
    this.clock.start()
    this._isPlaying = true
  }

  stop(): void {
    if (this.currentAction) {
      this.currentAction.stop()
      this.currentAction = null
    }
    this.clock.stop()
    this._isPlaying = false
  }

  pause(): void {
    if (this.currentAction) {
      this.currentAction.paused = true
    }
    this.clock.stop()
    this._isPlaying = false
  }

  resume(): void {
    if (this.currentAction) {
      this.currentAction.paused = false
    }
    this.clock.start()
    this._isPlaying = true
  }

  setSpeed(speed: number): void {
    this._speed = speed
    if (this.currentAction) {
      this.currentAction.setEffectiveTimeScale(speed)
    }
  }

  setTime(time: number): void {
    if (this.currentAction) {
      this.currentAction.time = time
      this.mixer.update(0)
    }
  }

  update(): void {
    if (this._isPlaying) {
      const delta = this.clock.getDelta()
      this.mixer.update(delta)
    }
  }

  get isPlaying(): boolean {
    return this._isPlaying
  }

  get speed(): number {
    return this._speed
  }

  get currentTime(): number {
    return this.currentAction?.time ?? 0
  }

  get duration(): number {
    return this.currentAction?.getClip().duration ?? 0
  }

  dispose(): void {
    this.stop()
    this.mixer.uncacheRoot(this.mixer.getRoot())
  }
}
