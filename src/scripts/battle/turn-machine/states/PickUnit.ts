import { TurnState } from "../TurnState";
import { PickMoveLocation } from "./PickMoveLocation";
import { BattleSystemManager } from "../BattleSystemManager";
import { Debug } from "../../../DebugUtils";


export class PickUnit extends TurnState {
    get name() { return 'PickUnit'; }
    get revertible() { return true; }   // If each state is either auto-skipped on undo or must be explicitly cancelled via
    get skipOnUndo() { return false; }  //   some control or button press, I wonder if this property is even necessary.

    assert() {

    }

    configureScene() {
        this.assets.mapCursor.show();
        this.assets.uiSystem.show();
        // Ensure correct information is being displayed on UI Window System Reveal
        this.assets.uiSystem.inspectTile(this.assets.map.squareAt(this.assets.mapCursor.pos));

        this.assets.unitSwap == null;
    }

    update() {
        // Let button.A add a unit to unit swap
        if (this.assets.gamepad.button.A.pressed) {
            let pos = this.assets.mapCursor.pos;
            let square = this.assets.map.squareAt(pos);

            // TODO This should check team affiliation
            this.assets.unitSwap = square.unit;
        }

        // If a unit was a picked, flag advancement to next state
        if (this.assets.unitSwap != null)
            this.battleSystemManager.advanceToState(this.advanceStates.pickMoveLocation);
    }

    prev() {
        // Undo when rolling back
    }

    advanceStates = {
        pickMoveLocation: {state: PickMoveLocation, pre: () => {}}
    }
}