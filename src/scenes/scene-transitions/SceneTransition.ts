

enum TransitionPhase {
  /** VFX are prepared, but inactive. Awaits a signal from Game to begin operating. */
  Standby,
  /** VFX shutters are closing. Awaits a signal from Transition that it is complete. */
  In,
  /** VFX are maintaining screen opaqueness. Awaits a signal from Game to begin out-transitioning. */
  Idle,
  /** VFX shutters are opening. Awaits a signal from Transition that it is complete, or at least to yield viewport control. */
  Out,
  /** VFX shutters are still opening, but game activity may resume anyway. */
  Tail,
  /** VFX shutters are completely open. Game will disassemble this Transition object now. */
  Finished,
}

/** Describes the execution of a phase of a transition effect. */
export interface SceneTransitionPhase {
  /** Called once when this phase is first instigated. */
  onStart?(): void;
  /** Called every frame while this phase is in effect.
   * @param loadProgress a number with interval [0,1]. */
  onUpdate?(loadProgress: number): void;
  /** Called once when this phase is concluded.
   * Perform any object deconstruction as necessary. */
  onFinish?(): void;
}

const EMPTY_PHASE: SceneTransitionPhase = {};


/** 
 * Describes the biolerplate for a scene transition effect's operation.
 * @author Dei Valko
 * @version 0.0.1
 */
export abstract class SceneTransition {

  static TransitionPhase = TransitionPhase;

  /** Whether to destroy the last scene's assets to free up memory at the beginning
   * of the Idle phase instead of the Finish phase. Default: true.  
   * [!] Be very cautious about the scenes involved when overriding this value. */
  readonly destroyLastSceneDuringIdle = true;

  /** The current transition-phase this visual effect is in. */
  get phase() { return this._phase; }
  private _phase = TransitionPhase.Standby;

  /** This is an indication that there is currently a lot of visual activity occurring.
   * It is a suggestion to any inquirers that they may want to suspend their action; any activity
   * they carry out now may not be seeable by the end user. */
  get busy() {
    const { In, Idle, Out } = TransitionPhase;
    return this._phase === In || this._phase === Idle || this._phase === Out;
  }

  /** The phase currently in control of the VFX structures. */
  private phaseProcess!: SceneTransitionPhase;

  /** Contains relevant Pixi display objects. Referenceable by descendents of this class for VFX purposes. */
  protected readonly containers: {
    readonly overlayer: PIXI.Container;
    readonly lastScene: PIXI.Container;
    readonly nextScene: PIXI.Container;
  };


  constructor(overlayer: PIXI.Container, lastScene: PIXI.Container, nextScene: PIXI.Container) {
    this.containers = {overlayer, lastScene, nextScene};
  }

  /** Handles the clerical work between phase changes. */
  private changePhase(phase: SceneTransitionPhase) {
    (this.phaseProcess.onFinish) && this.phaseProcess.onFinish();
    this.phaseProcess = phase;
    (this.phaseProcess.onStart) && this.phaseProcess.onStart();
  }

  /**
   * @param progress A number with interval [0,1] representing the progress value of a loading bar. */
  update(progress: number) {
    (this.phaseProcess.onUpdate) && this.phaseProcess.onUpdate(progress);
  }

  /** Call to begin the transition-in effect process.
   * Will only work when this transition is in 'Standby' phase. */
  start() {
    if (this._phase !== TransitionPhase.Standby)
      return;
    this._phase = TransitionPhase.In;
    this.changePhase(this.phaseIn);
  }

  /** Call to begin the idle transition effect; signal to Game that asset loading
   * and scene deconstruction may occur now.
   * Will only work when this transition is in 'In' phase. */
  protected idle() {
    if (this._phase !== TransitionPhase.In)
      return;
    this._phase = TransitionPhase.Idle;
    this.changePhase(this.phaseIdle);
  }

  /** Call to begin the transition-out effect process.
   * Will only work when this transition is in 'Idle' phase. */
  loadComplete() {
    if (this._phase !== TransitionPhase.Idle)
      return;
    this._phase = TransitionPhase.Out;
    this.changePhase(this.phaseOut);
  }

  /** Call to indicate this transition is 'done'; leftover VFX will continue to animate.
   * Will only work when this transition is in 'Out' phase. */
  protected releaseBusyStatus() {
    if (this._phase !== TransitionPhase.Out)
      return;
    this._phase = TransitionPhase.Tail;
  }

  /** Call to indicate this transition is done. Game will destroy this transition's assets at the next opportunity.
   * Will only work when this transition is in 'Out' or 'Tail' phase. */
  protected finish() {
    if (this._phase !== TransitionPhase.Out && this._phase !== TransitionPhase.Tail)
      return;
    this._phase = TransitionPhase.Finished;
    this.changePhase(EMPTY_PHASE);
  }

  /** An optional step where transition assets may be built.
   * They can kind of be built anywhere. I don't know what I'm doing. */
  build(): void {};
  
  abstract phaseIn: SceneTransitionPhase;
  abstract phaseIdle: SceneTransitionPhase;
  abstract phaseOut: SceneTransitionPhase;

}
