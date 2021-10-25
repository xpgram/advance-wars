import { TurnState } from "../TurnState";
import { TurnStart } from "./TurnStart";

export class TurnChange extends TurnState {
    get name() { return 'TurnChange'; }
    get revertible() { return false; }
    get skipOnUndo() { return false; }

    advanceStates = {
        turnStart: {state: TurnStart, pre: () => {}}
    }

    assert() {

    }

    configureScene() {
        // TODO Rebind controller? BoardPlayer probably should know which input its listening from.
        this.assets.incrementTurnPlayer();
        this.advanceToState(this.advanceStates.turnStart);
    }

    update() {

    }

    prev() {

    }


}