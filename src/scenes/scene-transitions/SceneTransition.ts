import { PIXI } from "../../constants";
import { WorkOrder } from "../../scripts/CommonTypes";
import { GlobalTimer } from "../../scripts/timer/GlobalTimer";


enum Phase {
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


/** 
 * Describes the biolerplate for a scene transition effect's operation.
 * @author Dei Valko
 * @version 0.1.0
 */
export abstract class SceneTransition {

  static Phase = Phase;

  /** This is a convenient place for your initialization step. */
  protected abstract build(): void;

  /** This is a convenient place for your deconstruction step. Empty by default. */
  protected destroy(): void {};

  /** Timer or function callback managing the events of the animate-in phase of the transition effect. */
  protected abstract phaseIn: GlobalTimer | WorkOrder;
  /** Function callback managing the events of the transition's idle-while-loading animation effects.
   * @param progress A number with interval [0,1] where 1 is complete. Used for loading bars. */
  protected abstract idleLoop: (progress: number) => void;
  /** Timer or function callback managing the events of the animate-out phase of the transition effect. */
  protected abstract phaseOut: GlobalTimer | WorkOrder;

  /** Whether to destroy the last scene's assets to free up memory at the beginning
   * of the Idle phase instead of the Finish phase. Default: true.  
   * [!] Be very cautious about the scenes involved when overriding this value. */
  readonly destroyLastSceneDuringIdle: boolean = true;

  /** The current transition-phase this visual effect is in. */
  get phase() { return this._phase; }
  private _phase = Phase.Standby;

  /** True if this transition is awaiting the 'load-complete' signal to continue. */
  get idling() { return this._phase === Phase.Idle; }

  /** This is an indication that there is currently a lot of visual activity occurring.
   * It is a suggestion to any inquirers that they may want to suspend their action; any activity
   * they carry out now may not be seeable by the end user. */
  get busy() {
    const { In, Idle, Out } = Phase;
    return this._phase === In || this._phase === Idle || this._phase === Out;
  }

  /** True if this transition is concluded and may be disposed of. */
  get finished() { return this._phase === Phase.Finished; }

  /** An animation layer existing above all other elements of the scene.
   * Make opaque, for instance, to hide flickering during scene construction. */
  readonly overlayer: PIXI.Container;
  /** The scene layer for the scene being transitioned from. */
  readonly lastScene: PIXI.Container;
  /** The scene layer for the scene being transitioned to. */
  readonly nextScene: PIXI.Container;


  constructor(overlayer: PIXI.Container, lastScene: PIXI.Container, nextScene: PIXI.Container) {
    this.overlayer = overlayer;
    this.lastScene = lastScene;
    this.nextScene = nextScene;
  }

  /**
   * @param progress A number with interval [0,1] representing the progress value of a loading bar. */
  update(progress: number) {
    // Splits event types into different repositories.
    const split = (event: GlobalTimer | WorkOrder) => ({
      timer: (event instanceof GlobalTimer) ? event : undefined,
      workOrder: !(event instanceof GlobalTimer) ? event : undefined,
    });

    // Handles the execution of a `Timer | WorkOrder` event type.
    const processEvent = (event: GlobalTimer | WorkOrder, nextPhase: Phase) => {
      const advance = () => this._phase = nextPhase;
      const { timer, workOrder } = split(event);

      if (timer && !timer.started) {
        timer.at('end').do(advance);
        timer.start();
      }
      if (workOrder && workOrder())
        advance();
    }

    // Handle the execution of this transition effect.

    if (this.phase === Phase.In)
      processEvent(this.phaseIn, Phase.Idle);

    else if (this.phase === Phase.Idle)
      this.idleLoop(progress);

    else if (this.phase === Phase.Out || this.phase === Phase.Tail)
      processEvent(this.phaseOut, Phase.Finished);
  }

  /** Call to begin the transition-in effect process.
   * Will only work when this transition is in 'Standby' phase. */
  start() {
    if (this._phase === Phase.Standby) {
      this.build();
      this._phase = Phase.In;
    }
  }

  /** Call to begin the transition-out effect process.
   * Will only work when this transition is in 'Idle' phase. */
  loadComplete() {
    if (this._phase === Phase.Idle)
      this._phase = Phase.Out;
  }

  /** Call to indicate this transition is 'done'; leftover VFX will continue to animate.
   * Will only work when this transition is in 'Out' phase. */
  protected releaseBusyStatus() {
    if (this._phase === Phase.Out)
      this._phase = Phase.Tail;
  }

}
