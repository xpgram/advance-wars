import { TurnState, TurnStateConstructor } from "./TurnState";
import { Debug } from "../../DebugUtils";
import { BattleSceneControllers } from "./BattleSceneControllers";
import { Game } from "../../..";
import { NullTurnState } from "./NullTurnState";
import { GameStart } from "./states/GameStart";
import { Common } from "../../CommonUtils";
import { Keys } from "../../controls/KeyboardObserver";

const STACK_TRACE_LIMIT = 20;
const QUEUE_STACK_WARNING = 30;

export type NextState = {
  state: TurnStateConstructor,
  pre?: Function
}

enum TransitionTo {
  None,
  NoneFromRegress,
  Next,
  NextFromRegress,
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
  /** The default state of the manager. Empty. Does nothing. */
  private readonly NULL_STATE = new NullTurnState(this);

  /** Container for battle-system assets and interactibles. */
  controllers: BattleSceneControllers;

  /** A list containing the battle-system's state history. */
  private stack = new Array<TurnState>();
  /** A string list of all previously visited game states, kept for debugging purposes. */
  private stackTrace: { msg: string, mode: string, exit?: number }[] = [];
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
    this.NULL_STATE.destroy();
    //@ts-expect-error
    this.NULL_STATE = undefined;
    this.controllers.destroy();
    this.stack.forEach(state => { state.destroy(); });  // Break all references to self in state stack
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
    // Dev stack trace
    if (Game.devController.get(Keys.P).pressed)
      Debug.ping(this.getStackTrace());

    // Wait for the camera before doing anything.
    if (!this.controllers.camera.subjectInView)
      return;

    try {
      // nextState->new handler
      while (this.transitionIntent == TransitionTo.Next
        || this.transitionIntent == TransitionTo.NextFromRegress) {

        if (this.queue.length === 0)
          throw new Error(`Cannot advance to next in queue: queue is empty.`);

        const mode = (this.transitionIntent === TransitionTo.NextFromRegress)
          ? '⟳'
          : '→'
        this.transitionIntent = TransitionTo.None;

        // Close and log previous state.
        this.currentState.close();
        const exit = this.currentState.exit;
        this.log(mode, `${this.currentState.name}`, exit);

        // Setup next state
        const state = this.queue.shift() as TurnStateConstructor;
        const newState = new state(this);
        this.stack.push(newState);  // Add new state to stack (implicitly changes current)
        newState.wake();            // Run new state's scene configurer

        // Message logging
        Debug.log({
          msg: `Advancing to state ${state.name}`,
          priority: 4, // TODO Wtf does 4 mean?
          type: `TurnMachine`,
        });

        // Cull unreachables from stack
        this.cullNonRevertibles();
      }

      // nextState->none handler
      if (this.transitionIntent == TransitionTo.None
        || this.transitionIntent == TransitionTo.NoneFromRegress)
        this.currentState.update();

      // nextState->previous handler
      while (this.transitionIntent == TransitionTo.Previous
        || this.transitionIntent == TransitionTo.PreviousOnFail) {

        if (this.currentState === this.NULL_STATE)
          throw new Error(`Cannot revert state from null.`);
        if (!this.currentState.revertible)
          throw new Error(`Cannot revert unrevertible state ${this.currentState.name}.`);

        const oldState = this.stack.pop() as TurnState;
        this.queue.unshift(oldState.type);

        // Transition procedure
        if (this.transitionIntent == TransitionTo.Previous) {
          oldState.close();      // Runs generic close procedure
          oldState.prev();       // Ctrl+Z Undo for smooth backwards transition
          this.log('↩', `${oldState.name}`, oldState.exit);
          oldState.destroy();    // Free up memory
        } else {
          this.log('🛑', `${oldState.name}`, oldState.exit);
          oldState.destroy();
          this.transitionIntent = TransitionTo.Previous;
        }

        // Log new current state to trace history.
        if (this.currentState.skipOnUndo == false) {    // If 'stable,' signal to stop reverting.
          this.transitionIntent = TransitionTo.NoneFromRegress;
          this.currentState.wake({ fromRegress: true });
        }

        // Failure looping check
        if (this.stackFailureLoop())
          throw new Error(`Infinite failure loop detected.`);
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

  /** True if the current state has signalled an intent to change states. */
  get transitioning() {
    return this.transitionIntent !== TransitionTo.None
      && this.transitionIntent !== TransitionTo.NoneFromRegress;
  }

  /** Removes the first n entries from the state queue.
   * This is an undo method used by TurnStates to clean up after a regression.
   * The current state must provide itself as a safety mechanism; only the current state may request changes. */
  unqueue(requestedBy: TurnState, n: number) {
    if (this.isSelfsameState(requestedBy))
      this.queue = this.queue.slice(n);
  }

  /** Signals an AdvanceIntent to the turn system.
   * The current state must provide itself as a safety mechanism; only the current state may request changes.
   * Further turn states may be included to add to queue, but if none are provided, BSM will simply advance
   * to next in queue. */
  advance(requestedBy: TurnState, ...next: TurnStateConstructor[]) {
    if (!this.transitioning && this.isSelfsameState(requestedBy)) {
      this.queue.unshift(...next);
      this.transitionIntent = TransitionTo.Next;

      if (this.queue.length >= QUEUE_STACK_WARNING)
        Debug.warn(`TurnMachine: queue is ${this.queue.length} members long.`);
    }
  }

  /** Signals a RegressIntent to the turn system.
   * The current state must provide itself as a safety mechanism; only the current state may request changes. */
  regress(requestedBy: TurnState) {
    if (!this.transitioning && this.isSelfsameState(requestedBy))
      this.transitionIntent = TransitionTo.Previous;
  }

  /** Reduces the stack length at non-revertible break points. */
  cullNonRevertibles() {
    let idx = -1;
    // Find last non-revertible occurrence.
    for (let i = this.stack.length; i >= 0; i--)
      if (this.stack[i]?.revertible === false) {
        idx = i;
        break;
      }
    // Slice list and destroy states not needed.
    if (idx > -1) {
      const culled = this.stack.slice(0,idx);
      this.stack = this.stack.slice(idx);
      culled.forEach( s => s.destroy() );
      Debug.log({
        msg: `Culling ${idx} unreachable turnstates.`,
        priority: 4,
        type: `Turnmachine`,
      })
    }
  }

  /** Signals the BattleSystemManager that it should abandon its most recent state advancement and continue regressing to the
   * last stable state. Throws a fatal error if regression is impossible. */
  failToPreviousState(state: TurnState) {
    if (this.isSelfsameState(state) == false)
      return;

    if (this.stack.length > 1)
      this.transitionIntent = TransitionTo.PreviousOnFail;
    else {
      Debug.ping(this.getStackTrace());
      throw new Error('BattleSystemManager failed to advance state but has no state to revert to.');
    }
  }

  /** Returns true if the current stack is experiencing an infinite failure loop. */
  stackFailureLoop() {
    const sequence = Common.repeatingSequence(
      this.stackTrace.map(t => t.exit || 0).reverse(),
      5
    );
    const notEmpty = (sequence.length > 0);
    const errorCode = (sequence.some(n => n < 0));
    return notEmpty && errorCode;
  }

  /** Logs a string——which should be the name of a game state——to the manager's game state history. */
  private log(mode: string, msg: string, exit: number) {
    this.stackTrace.push({ msg, mode, exit });
    if (this.stackTrace.length > STACK_TRACE_LIMIT)
      this.stackTrace.shift();
  }

  /** Returns a string log of this battle-system's game state history. */
  getStackTrace() {
    const queue = this.queue
      .slice()
      .map((s, idx) => `${`${idx}`.padStart(2, '0')}: ${(new s(this)).name}`)
      .reverse()
      .join('\n');
    const mode = (this.transitionIntent === TransitionTo.PreviousOnFail)
      ? '🛑'
      : (this.transitionIntent === TransitionTo.NoneFromRegress)
        ? '⟳▶'
        : '▶';
    const cur = `cur: ${mode} ${this.currentState.exit} ${this.currentState.name}`;
    const trace = this.stackTrace
      .map(({ msg, mode, exit }, idx) => `${`${idx}`.padStart(2, '0')}: ${mode} ${exit} ${msg}`)
      .reverse()
      .join('\n');
    return `Game State History (last ${STACK_TRACE_LIMIT}):\nQueue\n${queue}\n${cur}\n${trace}`;
  }
}