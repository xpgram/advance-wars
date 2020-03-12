import { TurnState, TurnStateConstructor } from "./TurnState";
import { Debug } from "../../DebugUtils";
import { BattleSceneControllers } from "./BattleSceneControllers";
import { Game } from "../../..";
import { PickUnit } from "./states/PickUnit";

const STACK_TRACE_LIMIT = 20;
const STACK_SIZE_LIMIT = 100;   // Unenforced, but allocated.

export type NextState = {
    state: TurnStateConstructor,
    pre: Function
}

enum TransitionTo {
    None,
    Next,
    Previous
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

    /** Container for battle-system assets and interactibles. */
    controllers: BattleSceneControllers;

    /** A list containing the battle-system's state history. */
    private stack = new Array<TurnState>(STACK_SIZE_LIMIT);
    /** A string list of all previously visited game states, kept for debugging purposes. */
    private stackTrace = new Array<string>(STACK_TRACE_LIMIT);

    // TODO Define scenarioOptions
    constructor(scenarioOptions: {}) {
        this.controllers = new BattleSceneControllers({
            mapData: {
                width: 25,
                height: 9
            }
        });

        // Configure controllers to the given scenario
        //      Map layout
        //      Spawned enemies
        //      etc.

        let firstState: NextState = {
            state: PickUnit,
            pre: () => {}
        }

        this.advanceToState(firstState);
        Game.scene.ticker.add(this.update, this);
    }

    destroy() {
        //this.controllers.destroy();
        this.stack.forEach( state => {state.destroy();} );  // Break all references to self in state stack
        Game.scene.ticker.remove(this.update, this);
    }

    /** The currently active battle-system state. */
    get currentState(): TurnState {
        let idx = this.stack.length - 1;
        Debug.assert(idx >= 0, "Could not retrieve current turn-state: there was none.");

        return this.stack[this.stack.length - 1];
    }

    /** Wrapper which runs the current state's update step. */
    private update() {
        if (this.transitionIntent == TransitionTo.None)
            this.currentState.update();

        // nextState->new handler
        if (this.transitionIntent == TransitionTo.Next) {
            let newState = new this.nextState.state(this);
            this.log(newState.name);    // Log new state to trace history
            this.stack.push(newState);  // Add new state to stack (implicitly changes current)

            this.nextState.pre();       // Run any pre-setup from the last state
            this.currentState.wake();   // Run new state's scene configurer

            this.transitionIntent = TransitionTo.None;
        }
        
        // nextState->previous handler
        while (this.transitionIntent == TransitionTo.Previous) {
            let state = this.stack.pop();
            if (state) {
                state.prev();       // Ctrl+Z Undo for smooth backwards transition
                state.destroy();    // Free up memory
            }

            // Log transition and wake the new current state, or continue moving backwards if current state is not 'stable.'
            this.log(this.currentState.name);
            if (this.currentState.skipOnUndo == false) {
                this.transitionIntent = TransitionTo.None;
                this.currentState.wake();
            }
        }
    }

    /** Signals the BattleSystemManager that it should transition to nextState.state at the end of the current cycle,
     * and after calling nextState.pre(). */
    advanceToState(nextState: NextState) {
        this.transitionIntent = TransitionTo.Next;
        this.nextState = nextState;
    }

    /** Signals the BattleSystemManager that it should transition to the last stable game state before this one at the end of
     * the current cycle. Fails if there is no previous state to roll back to or if the current turn state would not allow it. */
    regressToPreviousState() {
        if (this.stack.length > 1 && this.currentState.revertible)
            this.transitionIntent = TransitionTo.Previous;
    }

    /** Logs a string——which should be the name of a game state——to the manager's game state history. */
    private log(msg: string) {
        this.stackTrace.push(msg);
        if (this.stackTrace.length > STACK_TRACE_LIMIT)
            this.stackTrace.shift();
    }

    /** Writes this battle-system's game state history to the console. */
    printStateHistory() {
        let str = "";
        let c = 0;
        this.stackTrace.forEach( item => {
            str = `${c}: ${item}\n${str}`;
            c++;
        });
        str = "Game State History:\n" + str;
        Debug.ping(str);
    }
}