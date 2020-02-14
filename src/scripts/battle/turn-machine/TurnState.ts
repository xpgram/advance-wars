import { Debug } from "../../DebugUtils";
import { BattleSceneControllers } from "./BattleSceneControllers";
import { BattleSystemManager } from "./BattleSystemManager";

export type TurnStateConstructor = {
    new (): TurnState;
}

export abstract class TurnState {

    abstract get name(): string;            // The formal name of this game state (for logging purposes).
    abstract get revertible(): boolean;     // Whether this state may revert to a previous one.
    abstract get skipOnUndo(): boolean;     // Whether this state is skipped when reached via reversion.

    /** A reference to the controlling battle system manager, the object which runs the
     * turn-state machine. */
    battleSystemManager: BattleSystemManager;

    /** All battle-scene-relevant objects, script controllers, and assets.
     * Provides access to the MapCursor, the Map itself, the UI windows, etc. */
    controllers: BattleSceneControllers;

    constructor(manager: BattleSystemManager, controllers: BattleSceneControllers) {
        this.battleSystemManager = manager;
        this.controllers = controllers;
    }

    destroy() {
        //@ts-ignore
        this.controllers = null;
        //@ts-ignore
        this.battleSystemManager = null;
    }

    /** Throws an error if state dependencies aren't met, such as this state
     * drawing a line between two points on the board but not knowing where they're located. */
    abstract assert(): void;

    /** Failing the pre-condition assertion, print the battle-system's state history and report
     * the failing condition as the given message. */
    protected throwError(msg: string) {
        this.battleSystemManager.printStateHistory();
        Debug.error(msg);
    }

    /** Explicitly enables control scripts relevant to the state (important to avoid conflicts.)
     * ControlScripts not enabled here are necessarily disabled. */
    abstract configureScene(): void;

    wake() {
        this.assert();
        this.controllers.disableAll();  // Reset the scene configuration
        this.configureScene();
    }

    /** Probably won't need to do much, but still.
     * Most control scripts will add themselves to the game.scene.ticker
     * This can at least check for conditions for advancement to be met. */
    abstract update(): void;

    /** Any to-dos before regressing to previous state.
     * This should perform a complete 'undo' of whatever variables this state was trying to affect. */
    abstract prev(): void;

    nextState: nextState | null = null;
    advanceStates = {
        // Ex.
        pickAttackTarget: {state: PickAttackTargetState, pre: () => {} },
        finalizeState: {state: FinalizeOrderState, pre: () => {} }

        // When picking an action, each action leads to a different scenario.
        // pickAttackTarget would let you pick an adjacent unit to brutalize.
        // Picking 'Wait' would end that unit's turn.
        // I'm still working out the details, but I want a stack + multi-destination state system.
        // .prev() undoes anything this state tried to before control is relinquished to the previous state in the stack.
        // .next() runs a callback described by the given new state to do any pre-setup this state might need to.
        // Often, it probably won't need to.
        // I'm tired.
    }

    // IMPLEMENT Not sure where, but something needs to signal/return the new state we're advancing to.
    // .next() is mostly a cleanup function. Probably useless, but maybe necessary.
    next() {
        if (this.nextState)
            this.nextState.pre();
    }
}

type nextState = {
    state: TurnState,
    pre: Function
}