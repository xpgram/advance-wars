import { Game } from "../../..";
import { Debug } from "../../DebugUtils";
import { Keys } from "../../controls/KeyboardObserver";
import { Common } from "../../CommonUtils";
import { StateObject } from "./StateObject";
import { NullState } from "./NullState";
import { StateAssets } from "./StateAssets";


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

  /** The title/responsibility of this state machine. For debugging purposes. */
  readonly DOMAIN: string;

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

  /** A list containing the machine's state history.
   * States at the bottom of the stack which are no longer reachable are frequently culled. */
  private stack: StateObject<T>[] = [];

  /** A string list of all previously visited state objects, kept for debugging purposes. */
  private stackTrace: { msg: string, mode: string, exit?: number }[] = [];

  /** A list containing the machine's scheduled future states. */
  private queue: StateObject<T>[] = [];


  constructor(op: {name: string, assets: T, entryPoint: StateConcatable<T>}) {
    this.DOMAIN = `SM_${op.name}`;
    this.assets = op.assets;

    this.pushQueue([op.entryPoint]);
    this.advance(this.NULL_STATE);  // NULL_STATE is supplied to pass control-ownership verification.

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

  /** The currently active machine state object. This is NULL_STATE by default. */
  protected get currentState(): StateObject<T> {
    const state = this.stack[this.stack.length - 1];
    return (state) ? state : this.NULL_STATE;
  }

  /** The machine's update step which runs the current state's update step and handles transition requests. */
  private update() {
    // Dev stack trace
    if (Game.devController.pressed(Keys.P))
      Debug.ping(this.getStackTrace());

    // On major machine failure, halt completely.
    if (this.transitionIntent === TransitionTo.SystemFailure)
      return;

    // nextState->new handler
    try {
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
        this.stack.push(state); // Add new state to stack (implicitly changes current)
        state.wake();           // Run new state's scene configurer

        // System log line
        Debug.log(this.DOMAIN, 'HandleAdvanceToState', {
          message: `Advanced from '${lastState.name}' to '${state.name}'`,
        });

        // Cull unreachables from stack
        this.cullNonRevertibles();
      }

      // nextState->none handler
      if (this.transitionIntent == TransitionTo.None
        || this.transitionIntent == TransitionTo.NoneFromRegress) {

        try {
          this.currentState.updateSystem();
          if (!this.assets.suspendInteractivity || !this.assets.suspendInteractivity())
            this.currentState.updateInteractions();
        } catch(err) {
          Debug.log(this.DOMAIN, 'StateUpdate', {
            message: `Attempting to regress to previous state from ${this.currentState.name}.`,
            reason: `${err}`,
            error: true,
          });
          this.failToPreviousState(this.currentState);
            // TODO This was written to handle failures during configure() calls; does this still work here?
        }
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

        // Transition procedure
        if (this.transitionIntent === TransitionTo.Previous) {
          oldState.close();      // Runs generic close procedure
          oldState.prev();       // Ctrl+Z Undo for smooth backwards transition
          this.log('↩', `${oldState.name}`, oldState.exit);
        } else if (this.transitionIntent === TransitionTo.PreviousOnFail) {
          this.log('🛑', `${oldState.name}`, oldState.exit);
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
        Debug.log(this.DOMAIN, 'HandleRegressToState', {
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
      Debug.log(this.DOMAIN, 'RequestAction_VerifySource', {
        message: `Rejecting intent.`,
        reason: `Request from '${state.name}' does not match active state ('${this.currentState.name}').`,
        warn: true,
      });
      return false;
    }
    return true;
  }

  /** Returns true if the machine is currently handling a transition request, also logs a warning.  
   * This function is used to assert concurrent transition requests are not made. */
  private isAlreadyTransitioning(state: StateObject<T>) {
    if (this.transitioning) {
      Debug.log(this.DOMAIN, 'RequestAction_VerifyIdle', {
        message: `Rejecting intent to transition by '${state.name}'.`,
        reason: `A transition is already in progress.`,
        warn: true,
      })
      return true;
    }
    return false;
  }

  /** True if the current state has signalled an intent to change states. */
  get transitioning() {
    return this.transitionIntent !== TransitionTo.None
      && this.transitionIntent !== TransitionTo.NoneFromRegress;
  }

  /** Add concatable state objects or types to this machine's scheduled queue. */
  protected pushQueue(next: StateConcatable<T>[]) {
    const nextObjects = next.map(state => {
      const instance = (state instanceof StateObject<T>) ? state : new state();
      instance.sysinit(this);
      return instance;
    });
    this.queue.unshift(...nextObjects);
  }

  /** Removes the first n entries from the state queue.
   * This is an undo method used by StateObjects to clean up after a regression.
   * The current state must provide itself as a safety mechanism; only the current state may request changes. */
  unqueue(requestedBy: StateObject<T>, n: number) {
    if (!this.isSelfsameState(requestedBy))
      return;

    this.queue.slice(0,n).forEach( s => s.destroy() );
    this.queue = this.queue.slice(n);
  }

  /** Signals an AdvanceIntent to the machine.
   * The current state must provide itself as a safety mechanism; only the current state may request changes.
   * Further states may be included to add to the queue, but if none are provided, the machine will simply
   * advance to the next in queue. */
  advance(requestedBy: StateObject<T>, ...next: StateConcatable<T>[]) {
    if (!this.isSelfsameState(requestedBy) || this.isAlreadyTransitioning(requestedBy))
      return;
    
    this.pushQueue(next);
    this.transitionIntent = TransitionTo.Next;

    if (this.queue.length >= QUEUE_STACK_WARNING)
      Debug.log(this.DOMAIN, 'QueueNewStates', {
        message: `TurnMachine: queue is ${this.queue.length} members long; warning level is ${QUEUE_STACK_WARNING}.`,
        warn: true,
      });
  }

  /** Signals a RegressIntent to the machine.
   * The current state must provide itself as a safety mechanism; only the current state may request changes. */
  regress(requestedBy: StateObject<T>) {
    if (!this.isSelfsameState(requestedBy) || this.isAlreadyTransitioning(requestedBy))
      return;

    this.transitionIntent = TransitionTo.Previous;
  }

  /** Signals a RegressIntent to some specific state or class of state to the machine.  
   * The current state must provide itself as a safety mechanism; only the current state may request changes. */
  regressTo(requestedBy: StateObject<T>, target: StateObject<T> | typeof StateObject<T>) {
    if (!this.isSelfsameState(requestedBy) || this.isAlreadyTransitioning(requestedBy))
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
      Debug.log(this.DOMAIN, 'CullStateStack', {
        message: `Culled ${idx} unreachable turnstates.`,
      })
    }
  }

  /** Signals to the machine that it should abandon its most recent state advancement and continue regressing to the
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

  /** Logs a string——which should be the name of a state object——to the machine's state history. */
  private log(mode: string, msg: string, exit: number) {
    this.stackTrace.push({ msg, mode, exit });
    if (this.stackTrace.length > STACK_TRACE_LIMIT)
      this.stackTrace.shift();
  }

  /** Returns a string log of this machine's state history. */
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
    return `State History for '${this.DOMAIN}' (last ${STACK_TRACE_LIMIT}):\nQueue\n${queue}\n${cur}\n${trace}`;
  }
}