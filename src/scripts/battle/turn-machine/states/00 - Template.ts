import { TurnState } from "../TurnState";

export class Template extends TurnState {
    get name() { return ''; }
    get revertible() { return true; }
    get skipOnUndo() { return false; }

    advanceStates = {
        stateName: {state: Template, pre: () => {}}
    }

    assert() {
        // That there are no configuration conflicts
    }

    configureScene() {
        // Setup the scene
    }

    update() {
        // Observer for next-state's pre-conditions
    }

    prev() {
        // Undo when rolling back
    }
}