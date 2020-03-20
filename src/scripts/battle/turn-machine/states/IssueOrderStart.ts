import { TurnState } from "../TurnState";
import { MoveUnit } from "./MoveUnit";
import { Point } from "../../../Common/Point";
import { ShowUnitAttackRange } from "./ShowUnitAttackRange";
import { MoveCamera } from "./MoveCamera";


export class IssueOrderStart extends TurnState {
    get name() { return 'IssueOrderStart'; }
    get revertible() { return true; }   // If each state is either auto-skipped on undo or must be explicitly cancelled via
    get skipOnUndo() { return false; }  //   some control or button press, I wonder if this property is even necessary.

    protected assert() {

    }

    protected configureScene() {
        this.assets.mapCursor.show();
        this.assets.uiSystem.show();
        // Ensure correct information is being displayed on UI Window System Reveal
        this.assets.uiSystem.inspectTile(this.assets.map.squareAt(this.assets.mapCursor.pos));

        this.assets.camera.followTarget = this.assets.mapCursor;

        this.assets.units.traveler == null;
    }

    update() {
        // Let button.A add a unit to unit swap
        if (this.assets.gamepad.button.A.pressed) {
            let pos = this.assets.mapCursor.pos;
            let square = this.assets.map.squareAt(pos);

            // TODO This should check team affiliation
            if (square.unit) {
                if (square.unit.orderable) {
                    this.assets.units.traveler = square.unit;
                    this.battleSystemManager.advanceToState(this.advanceStates.pickMoveLocation);
                }
            }
        }
        // On B.press, show unit attack range or initiate move camera mode.
        else if (this.assets.gamepad.button.B.pressed) {
            let pos = this.assets.mapCursor.pos;
            let square = this.assets.map.squareAt(pos);

            if (square.unit) {
                this.assets.locations.focus = new Point(pos);
                this.battleSystemManager.advanceToState(this.advanceStates.showUnitAttackRange);
            }
            else
                this.battleSystemManager.advanceToState(this.advanceStates.moveCamera);
        }
    }

    prev() {
        // Undo when rolling back
    }

    advanceStates = {
        pickMoveLocation: {state: MoveUnit, pre: () => {}},
        showUnitAttackRange: {state: ShowUnitAttackRange, pre: () => {}},
        moveCamera: {state: MoveCamera, pre: () => {}}
    }
}