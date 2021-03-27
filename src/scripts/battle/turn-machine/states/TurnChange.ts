import { TurnState } from "../TurnState";

export class TurnChange extends TurnState {
    get name() { return 'TurnChange'; }
    get revertible() { return true; }
    get skipOnUndo() { return false; }

    assert() {

    }

    configureScene() {
        // Identify next turn taker
        // Set them up to be in control of player systems
        // Transition to IssueOrderStart
        
    }

    update() {

    }

    prev() {

    }


}