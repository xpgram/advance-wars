import { Game } from "../../..";
import { Debug } from "../../DebugUtils";
import { Keys } from "../../controls/KeyboardObserver";
import { Common } from "../../CommonUtils";
import { StateObject } from "./StateObject";
import { NullState } from "./NullState";
import { StateAssets } from "./StateAssets";

const DOMAIN = 'StateMachine';

const STACK_TRACE_LIMIT = 20;
const QUEUE_STACK_WARNING = 30;

/**  */
export type StateConcatable<T> = StateObject<T> | (new () => StateObject<T>);

enum TransitionTo {
  /** No intent to transition. Indicates the current state is settled. */
  None,
  /** No intent to transition. Indicates the current state is settled, but from the reverse direction. */
  NoneFromRegress,
  /** Intent to move forward-in-time in the stack. */
  Next,

  /** Indicates logline should display '⟳' for 'replay'.  
   * I don't think this is used at all, and in fact, I don't even know how it would happen.
   * @deprecated */
  NextFromRegress,

  /** Intent to move backward-in-time in the stack. */
  Previous,
  /** Intent to move backward-in-time in the stack as a recovery mechanism from some fatal error. */
  PreviousOnFail,
  /** Indicates a complete process halt due to some unrecoverable error. */
  SystemFailure,
}


/* // TODO Refactor
The purpose of this class is to genericize the BSM into something I can use in any scene.
Key goals:
  - The assets object that inter-states use is of type T.
  - Discrete state-objects now require specific StateMaster<???> type references to infer their own type.
    An SO for StateMaster<MainMenuAssets> will refuse to work with a reference to StateMaster<BattleSystemAssets>, for instance.
  - Battle-scene-specific calls and inferences need to be migrated to BattleSystemAssets instead.
  - All state-switching and error-catching/reporting functions must remain intact or even be expanded.
    This is obviously the point, I just like keeping checklists.

  - Queue packages SOs with constructor data passed in from whomever made the advance() request
  - When/how does the machine advance from NULL_STATE to the entry point? Is that request made outside the machine?

I've gotten rid of the obvious redlines.
I haven't gone over much of the implementation yet, though.
*/

/** This class is responsible for starting and maintaining a generic state machine.  
 * Primarily, this covers the operation of the current StateObject and the management of the inter-
 * state transition process, as well as a log of all of these operations and the resulting global
 * stack structure.
 * 
 * Every state machine holds a reference to a common set of components and variables called `assets`
 * which determines the machine's generic type. State objects, naturally dependent on these assets,
 * will only work with a StateMaster of a matching assets type.
 * 
 * StateObjects when written should extend the abstract class `StateObject<T>`, but should explicitly
 * define what common object `T` is.
 */
export class StateMaster<T extends StateAssets> {

  /** Reference to the inter-machine-state data object.  
   * Useful for maintaining global references among state objects to variables or references
   * to common components. 
   * 
   * Note that state-specific data may be passed to those states directly via requests to advance()
   * the machine state. */
  readonly assets: T;

  /** Enum flag indicating what the state machine intends to do on next cycle. */
  private transitionIntent = TransitionTo.None;
  /** The default state of the machine. Empty. Does nothing. */
  private readonly NULL_STATE = new NullState<T>();

  /** Repository for the state object to regress to during multi-regress. */
  private regressTarget?: StateObject<T> | typeof StateObject<T>;
  private get regressTargetLogString(): string {
    const title = this.regressTarget?.name;
    const obj_tag = (this.regressTarget instanceof StateObject<T>) ? ' (obj)' : ' (class)';
    return `${title}${obj_tag}`;
  }

  /** A list containing the machine's state history. */
  private stack: StateObject<T>[] = [];
  /** A string list of all previously visited state objects, kept for debugging purposes. */
  private stackTrace: { msg: string, mode: string, exit?: number }[] = [];
  /** A list containing the machine's upcoming states. */
  private queue: StateObject<T>[] = [];
    // TODO Can this be objects that get constructed immediately?
    // Then states can be added with constructor data whenever
    // TODO Can SOs have a return value?


  constructor(entryPoint: StateConcatable<T>, assetsObject: T) {
    this.assets = assetsObject;

    this.pushQueue([entryPoint]);
    this.advance(this.NULL_STATE);
      // TODO When does this advance to the entry point?
      // I don't remember how this works.

    Game.scene.ticker.add(this.update, this);
  }

  destroy() {
    this.NULL_STATE.destroy();
    //@ts-expect-error
    this.NULL_STATE = undefined;
    (this.assets.destroy && this.assets.destroy());
    this.stack.forEach(state => { state.destroy(); });  // Break all references to self in state stack
    Game.scene.ticker.remove(this.update, this);
  }

  /** The currently active battle-system state. */
  get currentState(): StateObject<T> {
    const state = this.stack[this.stack.length - 1];
    return (state) ? state : this.NULL_STATE;
  }

  /** Turn Machine's update step which runs the current state's update step and handles
   * transition requests. */
  private update() {
    // Dev stack trace
    if (Game.devController.pressed(Keys.P))
      Debug.ping(this.getStackTrace());

    // On major BSM failure, halt completely.
    if (this.transitionIntent === TransitionTo.SystemFailure)
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
        const lastState = this.currentState;
        this.currentState.close();
        const exit = this.currentState.exit;
        this.log(mode, `${this.currentState.name}`, exit);

        // Setup next state
        const state = this.queue.shift() as StateObject<T>;
        state.sysinit(this);
        this.stack.push(state); // Add new state to stack (implicitly changes current)
        state.wake();           // Run new state's scene configurer

        // System log line
        Debug.log(DOMAIN, 'HandleAdvanceToState', {
          message: `Advanced from '${lastState.name}' to '${state.name}'`,
        });

        // Cull unreachables from stack
        this.cullNonRevertibles();
      }

      // nextState->none handler
      if (this.transitionIntent == TransitionTo.None
        || this.transitionIntent == TransitionTo.NoneFromRegress) {

        this.currentState.updateSystem();
        if (!this.assets.suspendInteractivity || !this.assets.suspendInteractivity())
          this.currentState.updateInteractions();
      }

      // nextState->previous handler
      while (this.transitionIntent == TransitionTo.Previous
        || this.transitionIntent == TransitionTo.PreviousOnFail) {

        // Failure looping check
        if (this.stackFailureLoop())
          throw new Error(`Infinite failure loop detected.`);
        if (this.currentState === this.NULL_STATE)
          throw new Error(`Cannot revert state from null.`);
        if (!this.currentState.revertible)
          throw new Error(`Cannot revert unrevertible state ${this.currentState.name}. RegressTarget=${this.regressTargetLogString}`);

        const oldState = this.stack.pop() as StateObject<T>;
        this.queue.unshift(oldState);
          // FIXME Wait. This is undo, right? How do I redo a fresh new object?
          // God damn it, this is what I was trying to avoid.
          // If we enter oldState, it modifies itself, then we leave, but later we *re-enter,* I
          // can't assume the state is new. Which means each state needs reset() behavior.
          // God.. fucking.. ugh!
          // 
          // I'll shelve it for now. Remembering an old future-state could be a nice convenience ¯\_(ツ)_/¯

        // Transition procedure
        if (this.transitionIntent === TransitionTo.Previous) {
          oldState.close();      // Runs generic close procedure
          oldState.prev();       // Ctrl+Z Undo for smooth backwards transition
          this.log('↩', `${oldState.name}`, oldState.exit);
          oldState.destroy();    // Free up memory
        } else if (this.transitionIntent === TransitionTo.PreviousOnFail) {
          this.log('🛑', `${oldState.name}`, oldState.exit);
          oldState.destroy();
          this.transitionIntent = TransitionTo.Previous;
        }

        let stateAwakened = false;

        // If a suitable 
        const targetFound = (this.regressTarget === this.currentState || this.regressTarget === this.currentState.type);
        const noTarget = (!this.regressTarget);
        const stableState = (this.currentState.skipOnUndo === false);

        if (targetFound || noTarget && stableState) {
            this.transitionIntent = TransitionTo.NoneFromRegress;
            this.currentState.wake({ fromRegress: true });
            stateAwakened = true;
        }

        // System log line
        Debug.log(DOMAIN, 'HandleRegressToState', {
          message: `Regressed from '${oldState.name}' to '${this.currentState.name}'; ${(stateAwakened) ? 'state did wake.' : 'state did not wake.'}`,
        })
      }
    } catch (e) {
      Debug.ping(this.getStackTrace());
      this.transitionIntent = TransitionTo.SystemFailure;
      throw e;
    }
  }

  /** Returns true if the given state object is the active state object. */
  private isSelfsameState(state: StateObject<T>) {
    if (this.currentState !== state) {
      Debug.log(DOMAIN, 'RequestAction_VerifySource', {
        message: `Rejecting intent.`,
        reason: `Request from '${state.name}' does not match active state ('${this.currentState.name}').`,
        warn: true,
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

  /**  */
  protected pushQueue(next: StateConcatable<T>[]) {
    this.queue.unshift(
      ...next.map(state => (state instanceof StateObject<T>) ? state : new state() )
    );
  }

  /** Removes the first n entries from the state queue.
   * This is an undo method used by TurnStates to clean up after a regression.
   * The current state must provide itself as a safety mechanism; only the current state may request changes. */
  unqueue(requestedBy: StateObject<T>, n: number) {
    if (this.isSelfsameState(requestedBy))
      this.queue = this.queue.slice(n);
  }

  /** Signals an AdvanceIntent to the turn system.
   * The current state must provide itself as a safety mechanism; only the current state may request changes.
   * Further turn states may be included to add to queue, but if none are provided, BSM will simply advance
   * to next in queue. */
  advance(requestedBy: StateObject<T>, ...next: StateConcatable<T>[]) {
    if (!this.transitioning && this.isSelfsameState(requestedBy)) {
      this.pushQueue(next);
      this.transitionIntent = TransitionTo.Next;

      if (this.queue.length >= QUEUE_STACK_WARNING)
        Debug.warn(`TurnMachine: queue is ${this.queue.length} members long.`);
    }
  }

  /** Signals a RegressIntent to the turn system.
   * The current state must provide itself as a safety mechanism; only the current state may request changes. */
  regress(requestedBy: StateObject<T>) {
    if (!this.transitioning && this.isSelfsameState(requestedBy))
      this.transitionIntent = TransitionTo.Previous;
  }

  /**  */
  // TODO Combine with regress(), maybe rename for new purpose
  // TODO Log warnings about requesting an invalid state transition should be handled here.
  regressTo(requestedBy: StateObject<T>, target: StateObject<T> | typeof StateObject<T>) {
    // confirm request operator and transition request not already in progress
    if (this.transitioning || !this.isSelfsameState(requestedBy))
      return false;

    // find some state to regress to
    let success = false;
    const stack = this.stack.slice().reverse();
    for (const state of stack) {
      if (state === target || state.type === target) {
        success = true;
        break;
      }
      if (!state.revertible)
        break;
    }

    // signal multi-regress intent
    if (success) {
      this.transitionIntent = TransitionTo.Previous;
      this.regressTarget = target;
    }

    return success;
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
    if (idx > 0) {
      const culled = this.stack.slice(0,idx);
      this.stack = this.stack.slice(idx);
      culled.forEach( s => s.destroy() );
      Debug.log(DOMAIN, 'CullStateStack', {
        message: `Culled ${idx} unreachable turnstates.`,
      })
    }
  }

  /** Signals the BattleSystemManager that it should abandon its most recent state advancement and continue regressing to the
   * last stable state. Throws a fatal error if regression is impossible. */
  failToPreviousState(state: StateObject<T>) {
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
    const queue = this.queue;
    queue.slice()
      .map((s, idx) => `${`${idx}`.padStart(2, '0')}: ${s.name}`)
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