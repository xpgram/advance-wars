import { Debug } from "../../DebugUtils";
import { BattleSceneControllers } from "./BattleSceneControllers";
import { BattleSystemManager, NextState } from "./BattleSystemManager";
import { instructionData } from "./InstructionData";

export type TurnStateConstructor = {
  new(manager: BattleSystemManager): TurnState;
}

export class StateTransitionError extends Error {
  constructor(stateName: string, message: string) {
    super(`${stateName} → ${message}`);
    this.name = 'StateTransitionError';
  }
}

/** A battle-system state which represents a 'moment' in a 'turn.'
 * When active, this class would setup its own scene configuration, and run its own
 * update scripts operating the turn-moment. */
export abstract class TurnState {

  abstract get type(): TurnStateConstructor;  // The constructor type for this object.
  abstract get name(): string;            // The formal name of this game state (for logging purposes).
  abstract get revertible(): boolean;     // Whether this state may revert to a previous one.
  abstract get skipOnUndo(): boolean;     // Whether this state is skipped when reached via reversion.

  /** A reference to the controlling battle system manager, the object which runs the
   * turn-state machine. */
  protected battleSystemManager: BattleSystemManager;

  /** All battle-scene-relevant objects, script controllers, and assets.
   * Provides access to the MapCursor, the Map itself, the UI windows, etc. */
  protected assets: BattleSceneControllers;

  /** Accessors to all commonly requested objects. */
  protected data = instructionData.data;

  /** The status code this program has concluded with.
   * Positives are successful, negatives are failures, and 0 is default success. */
  get exit() { return this._exit; }
  protected _exit = 0;

  /** The number of states pushed into the next-state queue during AdvanceIntent.
   * Used during undo procedures. */
  private queueChange = 0;

  constructor(manager: BattleSystemManager) {
    this.battleSystemManager = manager;
    this.assets = manager.controllers;
  }

  readonly destroyed = false;
  destroy() {
    this.onDestroy();
    //@ts-expect-error
    this.destroyed = true;
    //@ts-expect-error
    this.assets = null;
    //@ts-expect-error
    this.battleSystemManager = null;
  }

  /** State will assume control of the scene, asserting correct pre-state and configuring
   * its UI systems. This does not force the battle manager to use this state's update script. */
  wake({fromRegress = false} = {}) {
    try {
      this.battleSystemManager.unqueue(this, this.queueChange);
      this.queueChange = 0;
      instructionData.fill(this.assets);
      this.assets.hidePlayerSystems();  // Reset the scene configuration
      (!fromRegress)
        ? this.onAdvance()
        : this.onRegress();
      this.configureScene();
    } catch (err) {
      Debug.error(err);
      this.battleSystemManager.failToPreviousState(this);
      Debug.print(this.battleSystemManager.getStackTrace());
    }
  }

  /** Signal the state-manager that this state transition has failed and must be aborted.
   * @param message A description of what went wrong. */
  protected failTransition(message: string) {
    if (this._exit === 0) this._exit = -1;
    throw new StateTransitionError(this.name, message);
  }

  /** Asserts that the given data is dataful and not empty.
   * @deprecated Retrieve vars from this.data instead. */
  protected assertData<T>(data: T | null | undefined, msg?: string): T {
    if (data == null || data == undefined)
      this.failTransition(`Missing data: ${msg}`);
    return data as T;
  }

  /** Explicitly enables battle system components and control scripts relevant to this
   * game state; automatic defaults for these are always run before this state gets
   * control of anything to avoid conflicts.
   * Raising an error of any kind in this step will be caught and reported by the
   * Battle System Manager, and this will be auto-reverted to the last stable game state. */
  protected abstract configureScene(): void;

  /** Function called during destruction of the TurnState object. */
  protected onDestroy() { };

  /** Function called before configuration only when this state is advanced to. */
  protected onAdvance() { };

  /** Function called before configuration only when this state is regressed to. */
  protected onRegress() { };

  /** Frame-by-frame processing step for turn-engine's game state.
   * UI and UX player systems typically add themselves to the scene's ticker,
   * so this is primarily used for state-observation and next-state triggering.
   * This step is sometimes suspended by higher-order systems. */
  update() { };

  /** Frame-by-frame processing step for turn-engine's game state.
   * This method is called before update() and is never suspended by higher-order systems. */
  updateNonInterruptible() { };

  /** Generic close procedure called during any state transition. */
  close() { };

  /** Any to-dos before regressing to previous state.
   * This should perform a complete 'undo' of whatever variables this state was trying to affect. */
  prev() { };

  /** Pushes a request to the battle system manager to advance state to the one given. */
  advance(...next: TurnStateConstructor[]) {
    if (!this.battleSystemManager.transitioning) {
      this.queueChange = next.length;
      this.battleSystemManager.advance(this, ...next);
    } else
      console.warn(`State ${this.name} tried to advance during transition intent. Are we requesting multiple times?`);
  }

  /** Pushes a request to the battle system manager to revert state to the one previous. */
  regress() {
    if (!this.battleSystemManager.transitioning) {
      this.battleSystemManager.regress(this);
    } else
      console.warn(`State ${this.name} tried to regress during transition intent. Are we requesting multiple times?`);
  }
}