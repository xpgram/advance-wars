import { TurnState } from "./TurnState";
import { Debug } from "../../DebugUtils";

const STACK_TRACE_LIMIT = 20;
const STACK_SIZE_LIMIT = 100;   // Unenforced, but allocated.

export class TurnStateController {

    assets: BattleSceneAssets;

    stack = new Array<TurnState>(STACK_SIZE_LIMIT);
    stackTrace = new Array<string>(STACK_TRACE_LIMIT);

    get currentStep(): TurnState {
        return this.stack[this.stack.length - 1];
    }

    /** Wrapper which runs the current step's update step. */
    private update() {
        this.currentStep.update();
    }

    next(step: TurnStateConstructor) {
        let newStep = new step(this);

        this.currentStep.close();   // Finalize current step details
        this.stack.push(newStep);   // Add new step to stack
        this.log(this.currentStep.name);     // Log the new step in stack trace
        if (this.currentStep.assert())  // Assert that new step was set up properly.
            this.printStackTrace();
        this.currentStep.open();    // Run new step's scene setup.
    }

    prev() {
        this.currentStep.close();
        this.stack.pop();
        this.log(this.currentStep.name);

        // If the step being switched to should not execute during regression, call the next previous step and abort this one.
        if (this.currentStep.skipOnUndo) {
            this.currentStep.prev();
        // Otherwise, confirm this step is still set up properly and let it set up the scene.
        } else {
            this.currentStep.assert();
            this.currentStep.open();
        }
    }

    private log(msg: string) {
        this.stackTrace.push(msg);
        if (this.stackTrace.length > STACK_TRACE_LIMIT)
            this.stackTrace.shift();    // Saves memory (I guess), but is it inefficient?
    }

    private printStackTrace() {
        let str = "";
        this.stackTrace.forEach( item => {
            str = item + "\n" + str;
        });
        Debug.ping(str);
    }
}