
enum TransitionPhase {
  Standby,        // Waits for Game to call in()
  In,             // Moves to Idle when ready
  Idle,           // Waits for Game to call out()
  Out,            // Moves to Finished or Tail when ready
  Tail,           // Moves to Finished when ready
  Finished,       // Game will call destroy()
}


// TODO I might reduce this, actually.
// This abstract just needs to maintain a phase value.


// TODO I need to reduce this, actually.
// I plan to hold both scenes in memory temporarily for visual effects.
// So, 'Idle' isn't when scenes get deconstructed anyway.
// So, this should be a lot simpler.
// When triggered, the next scene is assembled in the background.
// When this transition is begun, it does its single-step transition effect. A wipe or something.
// If I need to move into a loading screen... I mean, I won't. But if I did, that might be a
// separate process invocation.
// 
// As written, I could do
//  - in => blank
//  - idle => blank (Game constructs next scene in background)
//  - out => burn shader effect from scene A to B
//  - tail => skipped
//  - finish => done
// Hm. Yeah, I guess we'll keep working on this.
// I suppose I could have a destroyLastDuringIdle setting.
// If I'm concerned about available memory between two scenes, it scares me a little
// that someone could just *forget* to unload the previous scene during idle, but
// if the setting defaulted to true at least it would have to be a conscious choice.
//
// The real problem is that these transitions are designed to be scene agnostic.
// They may transition between *any* two scenes. If one that allows this flavor 
// of scene memory management is selected by mistake, especially dynamically,
// this becomes kind of a sticky problem that could have been deliberately prevented
// from ever being an issue.
//
// Anyway, I would erase these notes and keep working, but I need to do my actual job now.

/**  */
export abstract class SceneTransition {

  static TransitionPhase = TransitionPhase;

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

  phaseProcess!: SceneTransitionPhase;


  constructor(transitionLayer: PIXI.Container, prevScene: PIXI.Container, nextScene: PIXI.Container) {
    // stub
  }

  private changePhase(phase: SceneTransitionPhase) {
    this.phaseProcess.onFinish?.call(this.phaseProcess);
    this.phaseProcess = phase;
    this.phaseProcess.onStart?.call(this.phaseProcess);
  }

  update(loadProgress: number) {
    this.phaseProcess.update?.call(this.phaseProcess, loadProgress);
  }

  /** Call to begin the transition effect process.
   * Will only work when this transition is in standby phase. */
  start() {
    if (this._phase !== TransitionPhase.Standby)
      return;
    this._phase = TransitionPhase.In;
    this.changePhase(this.phaseIn);
  }

  /** Call to begin the idle transition effect; signal to Game that asset loading
   * and scene deconstruction may occur now.
   * Will only work when this transition is in standby phase. */
  protected idle() {
    if (this._phase !== TransitionPhase.In)
      return;
    this._phase = TransitionPhase.Idle;
    this.changePhase(this.phaseIdle);
  }

  idleComplete() {
    if (this._phase !== TransitionPhase.Idle)
      return;
    this._phase = TransitionPhase.Out;
    this.changePhase(this.phaseOut);
  }



  abstract build(): void;
  
  abstract phaseIn: SceneTransitionPhase;
  abstract phaseIdle: SceneTransitionPhase;
  abstract phaseOut: SceneTransitionPhase;

}

/** Describes the execution of a phase of a transition effect. */
export interface SceneTransitionPhase {
  /** Called once when this phase is first instigated. */
  onStart?(): void;
  /** Called every frame while this phase is in effect.
   * @param loadProgress a number with interval [0,1]. */
  update?(loadProgress: number): void;
  /** Called once when this phase is concluded.
   * Perform any object deconstruction as necessary. */
  onFinish?(): void;
}
