import { Game } from "../../..";
import { Debug } from "../../DebugUtils";

export abstract class TurnState {
    /** A compendium of battle-scene objects.
     * Provides access to the MapCursor, the Map itself, the UI windows, etc., etc. */
    controls: BattleSceneControllables;

    /** A compendium of battle-scene operation-scripts.
     * Provides access to all ControlScript objects, which must be explicitly enabled in each state.
     * ControlScripts do things like allowing you to press B on empty land to hide units, or B on
     * inhabited land to see their attack range.
     * Then again, maybe these are just properties of the cursor. */
    controlScripts: BattleScenePlayerInputScripts;

    constructor() {}

    /** Throws an error (great for debugging) if controllables dependencies aren't met.
     * Things like there not being a source and destination point defined during the
     * unit-railcar-animation step, or worse Railcar.unitType not being defined. */
    protected abstract assertDependencies(): void;

    /** Explicitly enables control scripts relevant to the state (important to avoid conflicts.)
     * ControlScripts not enabled here are necessarily disabled. */
    protected abstract enableControls(): void;

    /** Probably won't need to do much, but still.
     * Most control scripts will add themselves to the game.scene.ticker
     * This can at least check for conditions for advancement to be met. */
    protected abstract update(): void;

    /** Any to-dos before regressing to previous state.
     * This should perform a complete 'undo' of whatever variables this state was trying to affect. */
    protected abstract prev(): void;

    init(controllables: BattleSceneControllables, inputControls: BattleScenePlayerInputScripts) {
        this.controls = controllables;
        this.controlScripts = inputControls;
        this.assertDependencies();

        // Clean up previous state's configurations.
        // IMPLEMENT this in a way which does not break the state-stack.
        // These two statements are not for clearing vars like MapCursor.position, that should
        // be handled in .prev(). These are purely for enabling/disabling visual/interactive components.
        this.controls.disableAll();
        this.controlScripts.disableAll();

        this.configureScene();  // Explicitly enable UI elements and interactibles.
        this.enableControls();  // Explicitly enable control scripts
        Game.scene.ticker.add(this.update, this);
    }

    destroy() {
        this.controls = null;
        this.controlScripts = null;
        Game.scene.ticker.remove(this.update, this);
    }

    nextState: nextState | null = null;
    advanceStates = {
        // Ex.
        pickAttackTarget: {state: new PickAttackTargetState(), pre: () => {} },
        finalizeState: {state: new FinalizeOrderState(), pre: () => {} }

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