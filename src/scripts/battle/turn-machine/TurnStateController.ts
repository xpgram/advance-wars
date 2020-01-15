import { TurnState } from "./TurnState";
import { Debug } from "../../DebugUtils";
import { Game } from "../../..";

const STACK_SIZE_LIMIT = 100;   // Unenforced, but allocated.

/** Operates the game's turn-based battle system. */
export class TurnStateController {

    assets: BattleSceneAssets;

    private stack = new Array<TurnState>(STACK_SIZE_LIMIT);

    constructor() {
        // TODO Open the FIRST game state here.
        Game.scene.ticker.add(this.update, this);
    }

    destroy() {
        //@ts-ignore
        this.assets = null;     // TODO Since this class likely constructs these, it should probably dismantle them, too.

        // Clear inter-references to states and this controller.
        this.stack.forEach( state => {
            state.destroy();
        })
        this.stack = [];
    }

    private get currentStep(): TurnState {
        return this.stack[this.stack.length - 1];
    }

    /** Wrapper which runs the current step's update step. */
    private update() {
        this.currentStep.update();
    }

    /** Advances the game's state to the given TurnState class. */
    next(step: TurnStateConstructor) {
        let newStep = new step(this);

        this.currentStep.close();
        this.advanceToStep(newStep);
        this.assertState();
        this.currentStep.open();
    }

    /** Reverts the game's state to the last stable one ('stable' meaning it does not skip on reversion.) */
    prev() {
        this.currentStep.undo();
        this.currentStep.close();
        this.revertStep();

        // TODO Predicklement: what if skipOnUndo = true does not allow us to reach a stable regression state?
        // Like, in the configuration [true, true, →false] where we attempt to revert, we end up in the configuration
        // [→true, true, false] and unable to revert any further. How do we then advance back up to the original configuration?
        
        // Something else, should all states be able to be regressed to?

        // If the step being switched to should not execute during regression, call the next previous step and abort this one.
        if (this.currentStep.skipOnUndo) {
            this.currentStep.undo();
        // Otherwise, confirm this step is still set up properly and let it set up the scene.
        } else {
            this.assertState();
            this.currentStep.open();
        }
    }

    /** Advances the controller's current state to the given state object. */
    private advanceToStep(step: TurnState) {
        this.stack.push(step);
    }

    /** Reverts the controller's current state to the previous state object in the stack. Future states are not preserved. */
    private revertStep() {
        this.stack.pop();
    }

    /** Asserts that the current state's execution conditions are met, and if not throws an error. */
    private assertState() {
        if (this.currentStep.assertDependencies() == false)
            this.printStackTrace();
    }

    /** Prints the controller's state history as far back as it goes. */
    private printStackTrace() {
        let c = 0;
        let str = "";
        this.stack.forEach( state => {
            str = `${c}: ${state.name}\n` + str;
        })
        Debug.assert(false, "Game state trajectory failed. Stack Trace:\n" + str);
    }
}