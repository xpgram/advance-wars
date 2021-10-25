import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";

export class TurnStart extends TurnState {
    get name() { return ''; }
    get revertible() { return false; }
    get skipOnUndo() { return false; }

    advanceStates = {
        checkBoardState: {state: CheckBoardState, pre: () => {}}
    }

    assert() {
        // That there are no configuration conflicts
    }

    configureScene() {
        this.assets.turnPlayer.units.forEach( u => u.orderable = true );
        this.advanceToState(this.advanceStates.checkBoardState);
    }

    update() {
        // Observer for next-state's pre-conditions
    }

    prev() {
        // Undo when rolling back
    }
}