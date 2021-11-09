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
    private stack = new Array<TurnState>();
    /** A string list of all previously visited game states, kept for debugging purposes. */
    private stackTrace = new Array<string>();

    // TODO Define scenarioOptions
    constructor(scenarioOptions: {}) {
        this.controllers = new BattleSceneControllers({
            // stub
        });

        // Configure controllers to the given scenario
        //      Map layout
        //      Spawned enemies
        //      etc.

        const firstState: NextState = {
            state: GameStart,
            pre: () => {}
        }

        this.advanceToState(this.NULL_STATE, firstState);
        Game.scene.ticker.add(this.update, this);
    }

    destroy() {
        //this.controllers.destroy();
        this.stack.forEach( state => {state.destroy();} );  // Break all references to self in state stack
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

                const { state, pre } = this.nextState;

                this.currentState.close();
                if (pre) pre();             // Run any pre-setup passed in from current state

                let newState = new state(this);
                this.stack.push(newState);  // Add new state to stack (implicitly changes current)
                this.log('→', `${newState.name}`);    // Log new state to trace history
                newState.wake();            // Run new state's scene configurer
            }
            
            // nextState->previous handler
            while (this.transitionIntent == TransitionTo.Previous
                || this.transitionIntent == TransitionTo.PreviousOnFail) {

                let oldState = this.stack.pop();    // Implicitly changes current
                if (this.transitionIntent == TransitionTo.Previous) {
                    oldState?.close();      // Runs generic close procedure
                    oldState?.prev();       // Ctrl+Z Undo for smooth backwards transition
                    oldState?.destroy();    // Free up memory
                } else {
                    this.log('🛑', `${oldState?.name}`);
                    oldState?.destroy();
                }

                this.log('↩', `${this.currentState.name}`); // Log new current state to trace history.
                if (this.currentState.skipOnUndo == false) {    // If 'stable,' signal to stop reverting.
                    this.transitionIntent = TransitionTo.None;
                    this.currentState.wake({fromRegress: true});
                }
            }
        } catch(e) {
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

    /** Signals the BattleSystemManager that it should transition to nextState.state at the end of the current cycle,
     * and after calling nextState.pre(). */
    advanceToState(state: TurnState, nextState: NextState) {
        if (this.isSelfsameState(state)) {
            this.transitionIntent = TransitionTo.Next;
            this.nextState = nextState;
        }
    }

    /** Signals the BattleSystemManager that it should transition to the last stable game state before this one at the end of
     * the current cycle. Fails if there is no previous state to roll back to or if the current turn state would not allow it. */
    regressToPreviousState(state: TurnState) {
        if (this.isSelfsameState(state)) {
            if (this.stack.length > 1 && this.currentState.revertible)
                this.transitionIntent = TransitionTo.Previous;
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
            Debug.error('BattleSystemManager failed to advance state but has no stable state to revert to.');
        }
    }

    /** Logs a string——which should be the name of a game state——to the manager's game state history. */
    private log(mode: string, msg: string, exit?: number) {
        // Add exit code from last to last
        if (this.stackTrace.length > 0) {
            const idx = this.stackTrace.length-1,
                item = this.stackTrace[idx],
                [mode, msg] = [item[0], item.slice(2)];
            this.stackTrace[idx] = `${mode} ${exit} ${msg}`;
        }
        // Push new state
        this.stackTrace.push(`${mode[0]} ${msg}`);
        if (this.stackTrace.length > STACK_TRACE_LIMIT)
            this.stackTrace.shift();
    }

    /** Returns a string log of this battle-system's game state history. */
    getStackTrace() {
        const trace = this.stackTrace.map( (item, idx) => `${idx}: ${item}` ).reverse();
        return `Game State History (last ${STACK_TRACE_LIMIT}):\n` + trace.join('\n');
    }
}