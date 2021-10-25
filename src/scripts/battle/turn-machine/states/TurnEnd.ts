import { TurnState } from "../TurnState";
import { TurnChange } from "./TurnChange";

export class TurnEnd extends TurnState {
    get name() { return ''; }
    get revertible() { return false; }
    get skipOnUndo() { return false; }

    advanceStates = {
      turnChange: {state: TurnChange, pre: () => {}}
    }

    assert() {
        // That there are no configuration conflicts
    }

    configureScene() {
        console.log(`TurnEnd: resetting all team units.`);
        this.assets.turnPlayer.units.forEach( u => {
            u.spent = false;
            u.orderable = false;
        });
        this.advanceToState(this.advanceStates.turnChange);
    }

    update() {
        // Observer for next-state's pre-conditions
    }

    prev() {
        // Undo when rolling back
    }
}