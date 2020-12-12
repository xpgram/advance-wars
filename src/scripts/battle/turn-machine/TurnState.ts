import { Debug } from "../../DebugUtils";
import { BattleSceneControllers } from "./BattleSceneControllers";
import { BattleSystemManager, NextState } from "./BattleSystemManager";
import { StringDictionary } from "../../CommonTypes";

export type TurnStateConstructor = {
    new (manager: BattleSystemManager): TurnState;
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

    abstract get name(): string;            // The formal name of this game state (for logging purposes).
    abstract get revertible(): boolean;     // Whether this state may revert to a previous one.
    abstract get skipOnUndo(): boolean;     // Whether this state is skipped when reached via reversion.

    /** A collection of states and pre-transition functions this state would lead to. */
    protected abstract advanceStates: StringDictionary<NextState>;

    /** A reference to the controlling battle system manager, the object which runs the
     * turn-state machine. */
    protected battleSystemManager: BattleSystemManager;

    /** All battle-scene-relevant objects, script controllers, and assets.
     * Provides access to the MapCursor, the Map itself, the UI windows, etc. */
    protected assets: BattleSceneControllers;

    constructor(manager: BattleSystemManager) {
        this.battleSystemManager = manager;
        this.assets = manager.controllers;
    }

    destroy() {
        //@ts-ignore
        this.assets = null;
        //@ts-ignore
        this.battleSystemManager = null;
    }

    /** State will assume control of the scene, asserting correct pre-state and configuring
     * its UI systems. This does not force the battle manager to use this state's update script. */
    wake() {
        try {
            this.assert();
            this.assets.hidePlayerSystems();  // Reset the scene configuration
            this.configureScene();
        } catch (err) {
            Debug.print(`${err.name}: ${err.message}\n`, this.battleSystemManager.getStackTrace());
            this.battleSystemManager.failToPreviousState();
        }
    }

    /** Failing the pre-condition assertion, print the battle-system's state history and report
     * the failing condition as the given message.
     * @deprecated Use failAssertion() */
    protected throwError(msg: string) {
        Debug.warn('TurnState.throwError() is deprecated. Use .failTransition() instead.');
        this.failTransition(msg);
    }

    /** Signal the state-manager that this state transition has failed and must be aborted.
     * @param message A description of what went wrong. */
    protected failTransition(message: string) {
        throw new StateTransitionError(this.name, message);
    }

    /** Asserts that the given data is dataful and not empty. */
    protected assertData<T>(data: T | null | undefined, msg?: string): T {
        if (data == null || data == undefined)
            this.failTransition(`Missing data: ${msg}`);
        return data as T;
    }

    /** Used to confirm inter-state dependencies important to this scene's construction or
     * execution. For example, that some previous state has chosen a combat-unit to issue
     * instructions to. If any error is raised during this function call, it is posted to the
     * console and the BattleSystemManager is signaled to reject this state advancement.
     * 
     * assert() should not be used to make changes to state-independent systems: they may
     * be irrevertible and difficult to trace should the assertion fail. */
    protected abstract assert(): void;

    /** Explicitly enables control scripts relevant to the state (important to avoid conflicts.)
     * ControlScripts not enabled here are necessarily disabled. */
    protected abstract configureScene(): void;

    /** Frame-by-frame processing step for turn-engine's game state.
     * UI and UX player systems typically add themselves to the scene's ticker,
     * so this is primarily used for state-observation and next-state triggering. */
    abstract update(): void;

    /** Generic close procedure called during any state transition. */
    close(): void {};

    /** Any to-dos before regressing to previous state.
     * This should perform a complete 'undo' of whatever variables this state was trying to affect. */
    abstract prev(): void;
}