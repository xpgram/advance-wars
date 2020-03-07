import { Debug } from "../../DebugUtils";
import { BattleSceneControllers } from "./BattleSceneControllers";
import { BattleSystemManager } from "./BattleSystemManager";

export type TurnStateConstructor = {
    new (manager: BattleSystemManager): TurnState;
}

/** A battle-system state which represents a 'moment' in a 'turn.'
 * When active, this class would setup its own scene configuration, and run its own
 * update scripts operating the turn-moment. */
export abstract class TurnState {

    abstract get name(): string;            // The formal name of this game state (for logging purposes).
    abstract get revertible(): boolean;     // Whether this state may revert to a previous one.
    abstract get skipOnUndo(): boolean;     // Whether this state is skipped when reached via reversion.

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

    /** State will assume control over the scene, asserting correct pre-state and configuring
     * its UI systems. This does not force the battle manager to use this state's update script. */
    wake() {
        this.assert();
        this.assets.hidePlayerSystems();  // Reset the scene configuration
        this.configureScene();
    }

    /** Failing the pre-condition assertion, print the battle-system's state history and report
     * the failing condition as the given message. */
    protected throwError(msg: string) {
        this.battleSystemManager.printStateHistory();
        Debug.error(msg);
    }

    /** Throws an error if state dependencies aren't met, such as this state
     * drawing a line between two points on the board but not knowing where they're located. */
    protected abstract assert(): void;

    /** Explicitly enables control scripts relevant to the state (important to avoid conflicts.)
     * ControlScripts not enabled here are necessarily disabled. */
    protected abstract configureScene(): void;

    /** Frame-by-frame processing step for turn-engine's game state.
     * UI and UX player systems typically add themselves to the scene's ticker,
     * so this is primarily used for state-observation and next-state triggering. */
    abstract update(): void;

    /** Any to-dos before regressing to previous state.
     * This should perform a complete 'undo' of whatever variables this state was trying to affect. */
    abstract prev(): void;
}