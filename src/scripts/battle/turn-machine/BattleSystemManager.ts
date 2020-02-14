import { TurnState, TurnStateConstructor } from "./TurnState";
import { Debug } from "../../DebugUtils";
import { BattleSceneControllers } from "./BattleSceneControllers";
import { Game } from "../../..";

const STACK_TRACE_LIMIT = 20;
const STACK_SIZE_LIMIT = 100;   // Unenforced, but allocated.

enum StateTransition {
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
    private intent: StateTransition = StateTransition.None;
    /** Container for the next state to transition to when advancing, should be empty otherwise. */
    private intentMaterial: {state: TurnStateConstructor, pre: () => void} | null = null;

    /** Container for battle-system assets and interactibles. */
    controllers: BattleSceneControllers;

    /** A list containing the battle-system's state history. */
    private stack = new Array<TurnState>(STACK_SIZE_LIMIT);
    /** A string list of all previously visited game states, kept for debugging purposes. */
    private stackTrace = new Array<string>(STACK_TRACE_LIMIT);

    // TODO Define scenarioOptions
    constructor(scenarioOptions: {}) {
        this.controllers = new BattleSceneControllers();

        // Configure controllers to the given scenario
        //      Map layout
        //      Spawned enemies
        //      etc.

        this.advanceToState();
        Game.scene.ticker.add(this.update, this);
    }

    destroy() {
        this.controllers.destroy();
        this.stack.forEach( state => {state.destroy();} );  // Break all references to self in state stack
        Game.scene.ticker.remove(this.update, this);
    }

    /** The currently active battle-system state. */
    get currentState(): TurnState {
        return this.stack[this.stack.length - 1];
    }

    /** Wrapper which runs the current state's update step. */
    private update() {
        this.currentState.update();

        if (this.intent == StateTransition.Next) {
            if (this.intentMaterial == null)
                Debug.error("Missing game state to transition to.");
            else {
                this.intentMaterial.pre();                  // Pre-setup function given by previous state
                let newState = new this.intentMaterial.state(this);

                this.stack.push(newState);          // Add new state to stack (implicitly changes current)
                this.log(this.currentState.name);   // Log new state to trace history
                this.currentState.assert();         // Assert state's preconditions
                this.currentState.wake();           // Run new state's scene configurer
            }
        }
        else if (this.intent == StateTransition.Previous) {
            let state = this.stack.pop();
            state?.destroy();

            this.log(this.currentState.name);
            if (this.currentState.skipOnUndo == false) {
                this.intent = StateTransition.None;
                this.currentState.wake();
            }
            // else: keep {intent = previous} for one more cycle
        }
    }

    /** Signals the BattleSystemManager that it should transition to the given state after running the preconfigure function
     * at the end of the current cycle. */
    advanceToState(state: TurnStateConstructor, preconfigure: () => void ) {
        this.intentMaterial = {
            state: state,
            pre: preconfigure
        }
        this.intent = StateTransition.Next;
    }

    /** Signals the BattleSystemManager that it should transition to the last stable game state before this one at the end of
     * the current cycle. */
    regressToPreviousState() {
        this.intent = StateTransition.Previous;
    }

    /** Logs a string——which should be the name of a game state——to the manager's game state history. */
    private log(msg: string) {
        this.stackTrace.push(msg);
        if (this.stackTrace.length > STACK_TRACE_LIMIT)
            this.stackTrace.shift();    // Saves memory (I guess), but is it inefficient?
    }

    /** Throws this battle-system's game state history as an error. */
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