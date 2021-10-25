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
        this.assets.turnPlayer.units.forEach( u => u.orderable = false );
        // TODO Unset color? Orderable and spent are different things.
        this.advanceToState(this.advanceStates.turnChange);
    }

    update() {
        // Observer for next-state's pre-conditions
    }

    prev() {
        // Undo when rolling back
    }
}