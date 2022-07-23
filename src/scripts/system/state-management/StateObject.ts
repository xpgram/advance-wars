import { ConstructorFor } from "../../CommonTypes";
import { Debug } from "../../DebugUtils";
import { StateAssets } from "./StateAssets";
import { StateConcatable, StateMaster } from "./StateMaster";


export class StateTransitionError extends Error {
  constructor(stateName: string, message: string) {
    super(`${stateName} → ${message}`);
    this.name = 'StateTransitionError';
  }
}

/** A discrete object describing the configuration and operation of a step in the
 * state machine it is a member of.
 * 
 * Note that while the constructor of extending classes may be used to add variability
 * to the behavior of a machine state, it will not have access to its machine's list
 * of components. Configuration of the environment should always happen in `configure()`. */
export abstract class StateObject<T extends StateAssets> {

  get DOMAIN() { return `${this.machine.DOMAIN}.${this.name}`; }

  abstract get type(): new (...args: any) => StateObject<T>;
  abstract get name(): string;            // The formal name of this game state (for logging purposes).
  abstract get revertible(): boolean;     // Whether this state may revert to a previous one.
  abstract get skipOnUndo(): boolean;     // Whether this state is skipped when reached via reversion.

  /**  */
  protected get machine(): StateMaster<T> {
    if (!this._machine)
      throw `${this.name}: Attempted to access reference to state-controller before that reference was filled. Has sysinit() been called?`;
    return this._machine;
  };
  private _machine?: StateMaster<T>;

  /** All battle-scene-relevant objects, script controllers, and assets.
   * Provides access to the MapCursor, the Map itself, the UI windows, etc. */
  protected get assets() { return this.machine.assets; }

  /** The status code this program has concluded with.
   * Positives are successful, negatives are failures, and 0 is default success. */
  get exit() { return this._exit; }
  protected _exit = 0;
    // TODO Formalize this numeric system, unless I have already.
    // I need an enum, probs.

  /** The number of states pushed into the next-state queue during AdvanceIntent.
   * Used during undo procedures. */
  private queueChange = 0;
    // TODO Reevaluate this; can I undo multiple times? Am I meant not to?



  get destroyed() { return this._destroyed; }
  private _destroyed = false;
  destroy() {
    this.onDestroy();
    this._destroyed = true;
    //@ts-expect-error
    this.machine = undefined;
  }

  /**  */
  sysinit(machine: StateMaster<T>) {
    this._machine = machine;
  }

  /** State will assume control of the scene, asserting correct pre-state and configuring
   * its UI systems. This does not force the battle manager to use this state's update script. */
  wake({fromRegress = false} = {}) {
    try {
      this.machine.unqueue(this, this.queueChange);
      this.queueChange = 0;
      (this.assets.resetAssets && this.assets.resetAssets());
      (!fromRegress)
        ? this.onAdvance()
        : this.onRegress();
      this.configure();
    } catch (err) {
      Debug.log(this.DOMAIN, "Wake", {
        message: `${err}`,
        error: true,
      });
      this.machine.failToPreviousState(this);
      Debug.print(this.machine.getStackTrace());
    }
  }

  /** Signal the state-manager that this state transition has failed and must be aborted.
   * @param message A description of what went wrong. */
  protected failTransition(message: string) {
    if (this._exit === 0)
      this._exit = -1;
    throw new StateTransitionError(this.name, message);
  }

  /** Configures the environment of the state machine via the components it has access to in `assets`.  
   * The StateAssets reset function, if one exists, is always called before configure(), and is intended
   * to allow this function to focus on enabling services instead of micro-managing each component.
   *
   * Raising an error of any kind in this step will be caught and reported by the
   * StateMaster, and this will be auto-reverted to the last stable game state. */
  protected abstract configure(): void;

  /** Function called during destruction of the TurnState object. */
  protected onDestroy() { };

  /** Function called before configuration only when this state is advanced to. */
  protected onAdvance() { };

  /** Function called before configuration only when this state is regressed to. */
  protected onRegress() { };
  
  /** Frame-by-frame processing step for turn-engine's game state.
   * This method is called before update() and is never suspended by higher-order systems. */
  updateSystem() { };

  /** Frame-by-frame processing step for turn-engine's game state.
   * UI and UX player systems typically add themselves to the scene's ticker,
   * so this is primarily used for state-observation and next-state triggering.
   * This step is sometimes suspended by higher-order systems. */
  updateInteractions() { };

  /** Generic close procedure called during any state transition. */
  close() { };

  /** Any to-dos before regressing to previous state.
   * This should perform a complete 'undo' of whatever variables this state was trying to affect. */
  prev() { };

  /** Pushes a request to the battle system manager to advance state to the one given. */
  advance(...next: StateConcatable<T>[]) {
    if (!this.machine.transitioning) {
      this.queueChange = next.length; // TODO What is this? I forget.
      this.machine.advance(this, ...next);
    } else
      Debug.log(this.DOMAIN, "AdvanceRequest", {
        message: ``,
        warn: true,
      })
      console.warn(`State ${this.name} tried to advance during transition intent. Are we requesting multiple times?`);

      // TODO I fixed this log message not to occur here but in StateMaster, however...
      // I have to keep the transitioning check here anyway because there is metadata to handle.
      // And I think Master has a more difficult time inferring the actual intent of the request anyway.
      // In any case, it's up for review. I'll leave this old implementation here for now.
  }

  /** Pushes a request to the battle system manager to revert state to the one previous. */
  regress() {
    if (!this.machine.transitioning) {
      this.machine.regress(this);
    } else
      console.warn(`State ${this.name} tried to regress during transition intent. Are we requesting multiple times?`);
  }

  /** Pushes a request to the state machine to revert state to a specific state or class of state object.
   * Returns `true` if such a state exists to regress to (and the system has initiated the request), and
   * `false` if no such regress request is satisfiable. */
  regressTo(target: StateObject<T> | (new (...args: any) => StateObject<T>)): boolean {
    return this.machine.regressTo(this, target);
  }
}