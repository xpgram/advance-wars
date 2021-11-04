import { TurnState, TurnStateConstructor } from "./TurnState";
import { Debug } from "../../DebugUtils";
import { BattleSceneControllers } from "./BattleSceneControllers";
import { Game } from "../../..";
import { NullTurnState } from "./NullTurnState";
import { GameStart } from "./states/GameStart";

const STACK_TRACE_LIMIT = 20;
const STACK_SIZE_LIMIT = 100;   // Unenforced

export type NextState = {
  state: TurnStateConstructor,
  pre?: Function
}

enum TransitionTo {
  None,
  Next,
  Previous,
  PreviousOnFail
}

/** This class is responsible for starting and operating a battle.
 * The scenario must be provided on instantiation, including board-layout, enemy placement, team COs, etc.
 * so that the map and accompanying game resources may be built and configured.
 * 
 * This class runs a state-machine operating the moment-to-moment gameplay, and keeps a log of its
 * trajectory through state-transitions for debugging purposes.
 */
export class BattleSystemManager {

  /** Enum flag indicating what the battle-system's state-machine intends to do on next cycle. */
  private transitionIntent = TransitionTo.None;
  /** Container for the next state to transition to when advancing, should be empty otherwise. */
  private nextState!: NextState;
  /** The default state of the manager. Empty. Does nothing. */
  private readonly NULL_STATE = new NullTurnState(this);

  /** Container for battle-system assets and interactibles. */
  controllers: BattleSceneControllers;

  /** A list containing the battle-system's state history. */
  private stack: TurnState[] = [];
  /** A string list of all previously visited game states, kept for debugging purposes. */
  private stackTrace: string[] = [];
  /** A list containing the battle-system's upcoming states. */
  private queue: TurnStateConstructor[] = [];

  // TODO Define scenarioOptions
  constructor(scenarioOptions: {}) {
    this.controllers = new BattleSceneControllers({
      // stub
    });

    // Configure controllers to the given scenario
    //      Map layout
    //      Spawned enemies
    //      etc.

    this.queue.push(GameStart);
    this.advance(this.NULL_STATE);

    Game.scene.ticker.add(this.update, this);
  }

  destroy() {
    //this.controllers.destroy();
    this.stack.forEach(state => state.destroy()); // Break all references to self in state stack
    Game.scene.ticker.remove(this.update, this);
  }

  /** The currently active battle-system state. */
  get currentState(): TurnState {
    const state = this.stack[this.stack.length - 1];
    return (state) ? state : this.NULL_STATE;
  }

  /** Turn Machine's update step which runs the current state's update step and handles
   * transition requests. */
  private update() {
    try {
      if (this.transitionIntent == TransitionTo.None)
        this.currentState.update();

      // nextState->new handler
      while (this.transitionIntent == TransitionTo.Next) {
        this.transitionIntent = TransitionTo.None;

        this.currentState.close();

        const type = this.queue.shift();
        if (!type)
          throw new Error(`Cannot advance to state: no states in queue.`);

        const state = new type(this);
        this.stack.push(state); // Add new state to stack (implicitly changes current)
        this.log(state.name);   // Log new state to trace history
        Debug.log({
          msg: `Advancing to state ${state.name}`,
          priority: 4,  // TODO Enum. 4 or 5 or whatever should be 'normal' or 'status update' or something.
          type: `TurnMachine`,
        });
        state.wake();           // Run new state's scene configurer
      }

      // nextState->previous handler
      while (this.transitionIntent == TransitionTo.Previous
        || this.transitionIntent == TransitionTo.PreviousOnFail) {

        const state = this.stack.pop();    // Implicitly changes current
        if (this.transitionIntent == TransitionTo.Previous) {
          state?.close();      // Runs generic close procedure
          state?.prev();       // Ctrl+Z Undo for smooth backwards transition
          state?.destroy();    // Free up memory
        } else {
          this.log(`${state?.name} (failed)`);
          state?.destroy();
        }

        // TODO What should happen on regress?
        // I think whatever the last additions were previous to this change need to be undone.
        // So.... ugh. queue changes need to be recorded. State changes too, perhaps.
        // It chould be an object type.
        //  {
        //    type: TurnStateConstructor,   // The state type to instantiate
        //    pre?: () => void,             // A function to call before state.wake()
        //    by: TurnState,                // Which state added it
        //    step: number,                 // Which addition number they were added under
        //  }
        // This way, the list can be filtered or whatever to erase staged changes.
        // Hm.
        // I'll have to think about this.
        // In the mean time, we gon' shelve this one.
        this.queue.unshift(state.type);

        this.log(this.currentState.name);               // Log new current state to trace history.
        if (this.currentState.skipOnUndo == false) {    // If 'stable,' signal to stop reverting.
          this.transitionIntent = TransitionTo.None;
          this.currentState.wake();
        }
      }
    } catch (e) {
      Debug.ping(this.getStackTrace());
      throw e;
    }
  }

  /** Returns true if the given state object is the active state object. */
  private isSelfsameState(state: TurnState) {
    if (this.currentState !== state) {
      Debug.log({
        msg: `State '${state.name}' requested a state shift, but active state is '${this.currentState.name}'`,
        priority: 3,
        type: `TurnMachine`,
      });
      return false;
    }
    return true;
  }

  /** Adds turnstate types to the system queue at the index given.
   * The zeroth will be the next advanced to when AdvanceIntent is signalled. */
  queueState(state: TurnState, next: TurnStateConstructor | TurnStateConstructor[], index: number = 0) {
    if (this.isSelfsameState(state)) {
      next = (Array.isArray(next)) ? next : [next];
      this.queue = [
        ...this.queue.slice(0, index),
        ...next,
        ...this.queue.slice(index),
      ];
    }
  }

  /** Signals an AdvanceIntent to the turn system. */
  advance(state: TurnState) {
    if (this.isSelfsameState(state)) {
      this.transitionIntent = TransitionTo.Next;
    }
  }

  /** Signals a RegressIntent to the turn system.
   * Regress will return decrementally to the last stable state on the next turn cycle.
   * Intent will fail if there is no previous stable intent to regress to. */
  regress(state: TurnState) {
    if (this.isSelfsameState(state)) {
      if (this.stack.length > 1 && this.currentState.revertible)
        this.transitionIntent = TransitionTo.Previous;
    }
  }

  /** Signals the BattleSystemManager that it should abandon its most recent state advancement and continue regressing to the
   * last stable state. Throws a fatal error if regression is impossible. */
  failToPreviousState(state: TurnState) {
    if (!this.isSelfsameState(state))
      return;

    if (this.stack.length > 1)
      this.transitionIntent = TransitionTo.PreviousOnFail;
    else {
      Debug.ping(this.getStackTrace());
      Debug.error('BattleSystemManager failed to advance state but has no stable state to revert to.');
    }
  }

  /** Logs a string——which should be the name of a game state——to the manager's game state history. */
  private log(msg: string) {
    this.stackTrace.push(msg);
    if (this.stackTrace.length > STACK_TRACE_LIMIT)
      this.stackTrace.shift();
  }

  /** Returns a string log of this battle-system's game state history. */
  getStackTrace() {
    const trace = this.stackTrace.map((item, idx) => `${idx}: ${item}`).reverse();
    // TODO Print queue as well
    return `Game State History (last ${STACK_TRACE_LIMIT}):\n` + trace.join('\n');
  }
}