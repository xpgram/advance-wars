import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { Debug } from "../../../DebugUtils";
import { CardinalDirection, CardinalVector } from "../../../Common/CardinalDirection";
import { AnimateMoveUnit } from "./AnimateMoveUnit";

export class MoveUnit extends TurnState {
    get name() { return 'MoveUnit'; }
    get revertible() { return true; }
    get skipOnUndo() { return false; }

    private travellingUnit!: UnitObject;
    private lastCursorPos = new Point(-1, -1);

    assert() {
        if (this.assets.units.traveler == null)
            this.throwError("Missing UnitObject for unit movement step.")
    }

    configureScene() {
        this.assets.mapCursor.show();
        this.assets.uiSystem.show();

        this.travellingUnit = this.assets.units.traveler as UnitObject;
        this.assets.map.squareAt(this.travellingUnit.boardLocation).hideUnit = true;

        this.assets.trackCar.buildNewAnimation(this.travellingUnit);
        this.assets.trackCar.show();

        this.assets.map.generateMovementMap(this.travellingUnit);
    }

    update() {
        if (this.lastCursorPos.notEqual(this.assets.mapCursor.pos)) {
            this.lastCursorPos = new Point(this.assets.mapCursor.pos);
            this.assets.map.recalculatePathToPoint(this.assets.units.traveler as UnitObject, this.lastCursorPos);
        }

        if (this.assets.gamepad.button.B.pressed)
            this.battleSystemManager.regressToPreviousState();
        else if (this.assets.gamepad.button.A.pressed
            && this.assets.map.squareAt(this.lastCursorPos).moveFlag == true
            && this.assets.map.squareAt(this.lastCursorPos).occupiable(this.assets.units.traveler as UnitObject)) {

            this.assets.locations.travelDestination = new Point(this.lastCursorPos);
            this.battleSystemManager.advanceToState(this.advanceStates.animateMoveUnit);
        }
    }

    prev() {
        this.assets.units.traveler = null;
        this.assets.map.squareAt(this.travellingUnit.boardLocation).hideUnit = false;
        this.assets.trackCar.hide();
        this.assets.map.clearMovementMap();

        this.assets.mapCursor.moveTo(this.travellingUnit.boardLocation);
    }

    advanceStates = {
        animateMoveUnit: {state: AnimateMoveUnit, pre: () => {} }
    }
}