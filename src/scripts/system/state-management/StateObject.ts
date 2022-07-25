
import { Type } from "../../CommonTypes";
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

  /** The syslog name for this object. */
  get DOMAIN() { return `${this.machine.DOMAIN}.${this.name}`; }

  /** Reference to this object's class type. */
  abstract get type(): Type<StateObject<T>>;

  /** The formal name of this game state (for logging purposes). Use `.DOMAIN` for the full state machine name. */
  abstract get name(): string;

  /** Whether this state may revert to a previous one. */
  abstract get revertible(): boolean;

  /** Whether this state is skipped when reached via reversion. */
  abstract get skipOnUndo(): boolean;

  /** Reference to the parent machine to this state object.  
   * Throws an error if accessed before its state master has been supplied. */
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
    // TODO Formalize this numeric system with an enum, unless I have already.

  /** The number of states pushed into the next-state queue during AdvanceIntent.
   * Used during undo procedures to remove said states. */
  private queueChange = 0;



  get destroyed() { return this._destroyed; }
  private _destroyed = false;
  destroy() {
    this.onDestroy();
    this._destroyed = true;
    this._machine = undefined;
  }

  /** Used by StateMaster to connect this state object to the state machine system. */
  sysinit(machine: StateMaster<T>) {
    if (this.sysinitComplete) {
      Debug.log(this.DOMAIN, 'SysInit', {
        message: `Rejecting sysinit request from ${machine.DOMAIN}`,
        reason: `State object already initialized.`,
        warn: true,
      })
      return;
    }

    this.sysinitComplete = true;
    this._machine = machine;
  }
  private sysinitComplete = false;

  /** State will assume control of the scene, asserting correct pre-state and configuring
   * its UI systems. This does not force the battle manager to use this state's update script. */
  wake({fromRegress = false} = {}) {
    try {
      this.machine.unqueue(this, this.queueChange);
      this.queueChange = 0;
      this.assets.resetAssets();
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
   * The StateAssets' reset function is always called before `configure()` and is intended to allow
   * this function to focus on enabling services instead of micro-managing each component.
   *
   * Raising an error of any kind in this step will be caught and reported by the
   * StateMaster, and control will be auto-reverted to the last stable game state. */
  protected abstract configure(): void;

  /** Function called during destruction of the TurnState object. */
  protected onDestroy() {};

  /** Function called before configuration only when this state is advanced to. */
  protected onAdvance() {};

  /** Function called before configuration only when this state is regressed to. */
  protected onRegress() {};
  
  /** Frame-by-frame processing step for this state object.
   * This method is called before update() and is never suspended by higher-order systems. This method is intended
   * to handle various clerical work about the system which *cannot* be suspended. Interactive operations should
   * be placed in `updateInput()`. */
  updateSystem() {};

  /** Frame-by-frame processing step to watch for player input or async operations.  
   * This step is sometimes suspended by higher-order systems (e.g. a camera moving to keep its subject in view). */
  updateInput() {};

  /** Generic close procedure called during any state transition. */
  close() {};

  /** Any to-dos before regressing to previous state.
   * This should perform a complete 'undo' of whatever variables this state was trying to affect. */
  prev() {};

  /** Pushes a request to the state master to direct the flow of control to the next state in queue,
   * or to the first of the states given here as a subroutine-style operation. */
  advance(...next: StateConcatable<T>[]) {
    const accepted = this.machine.advance(this, ...next);
    if (accepted)
      this.queueChange = next.length;
  }

  /** Pushes a request to the battle system manager to revert state to the one previous. */
  regress() {
    this.machine.regress(this);
  }

  /** Pushes a request to the state machine to revert state to a specific state or class of state object.
   * Returns `true` if such a state exists to regress to (and the system has initiated the request), and
   * `false` if no such regress request is satisfiable. */
  regressTo(target: StateObject<T> | Type<StateObject<T>>): boolean {
    return this.machine.regressTo(this, target);
  }
}