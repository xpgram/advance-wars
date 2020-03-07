import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { Debug } from "../../../DebugUtils";
import { CardinalDirection, CardinalVector } from "../../../Common/CardinalDirection";

export class PickMoveLocation extends TurnState {
    get name() { return 'PickMoveLocation'; }
    get revertible() { return true; }
    get skipOnUndo() { return false; }

    private travellingUnit!: UnitObject;
    private lastCursorPos = new Point(-1, -1);

    assert() {
        if (this.assets.unitSwap == null)
            this.throwError("Missing UnitObject for unit movement step.")
    }

    configureScene() {
        this.assets.mapCursor.show();
        this.assets.uiSystem.show();

        this.travellingUnit = this.assets.unitSwap as UnitObject;
        this.assets.map.squareAt(this.travellingUnit.boardLocation).hideUnit = true;

        this.assets.trackCar.buildNewAnimation(this.travellingUnit);
        this.assets.trackCar.show();

        this.assets.map.generateMovementMap(this.travellingUnit);
    }

    update() {
        if (this.lastCursorPos.notEqual(this.assets.mapCursor.pos)) {
            this.lastCursorPos = new Point(this.assets.mapCursor.pos);
            this.assets.map.recalculatePathToPoint(this.assets.unitSwap as UnitObject, this.lastCursorPos);
        }

        if (this.assets.gamepad.button.B.pressed)
            this.battleSystemManager.regressToPreviousState();
        else if (this.assets.gamepad.button.A.pressed
            && this.assets.map.squareAt(this.lastCursorPos).moveFlag == true) {

            // Build the new path, blah blah, test-out demo
            let trackPoint = new Point(this.travellingUnit.boardLocation);
            let trackSquare = this.assets.map.squareAt(trackPoint);
            let directions: CardinalDirection[] = [];

            // TODO What if squares are not in a path that ends?
            while (trackSquare.arrowTo) {
                directions.push(trackSquare.arrowTo);
                trackPoint = trackPoint.add(CardinalVector(trackSquare.arrowTo));
                trackSquare = this.assets.map.squareAt(trackPoint);
            }

            this.assets.trackCar.directions = directions;

            this.assets.trackCar.start();
        }
    }

    prev() {
        this.assets.unitSwap = null;
        this.assets.map.squareAt(this.travellingUnit.boardLocation).hideUnit = false;
        this.assets.trackCar.hide();
        this.assets.map.clearMovementMap();
    }

    //advanceStates = {
    //    animateUnitTravel: {state: AnimateUnitTravel, pre: () => {}}
    //}
}