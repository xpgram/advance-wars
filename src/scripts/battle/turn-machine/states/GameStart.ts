import { TurnState } from "../TurnState";
import { TurnStart } from "./TurnStart";

export class GameStart extends TurnState {
    get name() { return ''; }
    get revertible() { return false; }
    get skipOnUndo() { return false; }

    advanceStates = {
      turnChange: {state: TurnStart, pre: () => {}}
    }

    assert() { }

    configureScene() {
      this.advanceToState(this.advanceStates.turnChange);
    }

    update() { }

    prev() { }
}