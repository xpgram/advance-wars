import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { IssueOrderStart } from "./IssueOrderStart";
import { CardinalDirection, CardinalVector } from "../../../Common/CardinalDirection";
import { MapLayers } from "../../MapLayers";
import { Debug } from "../../../DebugUtils";

export class AnimateMoveUnit extends TurnState {
    get name() { return 'AnimateMoveUnit'; }
    get revertible() { return true; }
    get skipOnUndo() { return true; }

    travellingUnit!: UnitObject;
    travelDestination!: Point;
    travelPoints!: number;

    assert() {
        if (this.assets.units.traveler == null)
            this.throwError("Missing UnitObject for unit movement animation step.")
        if (this.assets.locations.travelDestination == null)
            this.throwError("No board location provided for unit destination.");
    }

    configureScene() {
        this.travellingUnit = this.assets.units.traveler as UnitObject;
        this.travelDestination = this.assets.locations.travelDestination as Point;

        this.assets.trackCar.buildNewAnimation(this.travellingUnit);
        this.assets.trackCar.show();    // It should already be shown

        // Build path from source point
        // Confirm final destination equals this.assets.selectedDestination
        // Setup and start animation
        // move unit on the board

        // Build the new path, blah blah, test-out demo
        let trackPoint = new Point(this.travellingUnit.boardLocation);
        let trackSquare = this.assets.map.squareAt(trackPoint);
        let directions: CardinalDirection[] = [];

        // TODO What if squares are not in a path that ends?
        // TODO Throw error if final point is not destination
        this.travelPoints = 0;
        while (trackSquare.arrowTo) {
            directions.push(trackSquare.arrowTo);
            trackPoint = trackPoint.add(CardinalVector(trackSquare.arrowTo));
            trackSquare = this.assets.map.squareAt(trackPoint);
            this.travelPoints += this.assets.map.squareAt(trackPoint).terrain.getMovementCost(this.travellingUnit.moveType);

            if (this.travelPoints > 200)
                Debug.error("Board arrow-path from source to destination may be looping.");
        }

        this.assets.trackCar.directions = directions;

        this.assets.trackCar.start();

        this.assets.map.clearMovementMap();
    }

    update() {
        // Skip animation on A.press or B.press
        if (this.assets.gamepad.button.A.pressed
            || this.assets.gamepad.button.B.pressed)
            this.assets.trackCar.skip();
        
        // When finished, advance to next state
        if (this.assets.trackCar.finished) {
            // TODO This is a temporary unit loop and should not be handled in this state.
            this.assets.map.squareAt(this.travellingUnit.boardLocation).hideUnit = false;
            this.assets.map.squareAt(this.travelDestination).hideUnit = false;
            this.assets.map.squareAt(this.travelDestination).moveFlag = false;  // Triggers setInfo
            // TODO Fix the setInfo bug above
            this.assets.units.traveler.visible = true;  // ← And this bug

            this.assets.map.moveUnit(this.travellingUnit.boardLocation, this.travelDestination);
            this.travellingUnit.gas -= this.travelPoints;

            this.battleSystemManager.advanceToState(this.advanceStates.issueOrderStart);
        }
    }

    prev() {
        // moves unit at this.assets.selectedDestination back to source
        // moves cursor back to source?
        /*
        this.assets.unitSwap = null;
        this.assets.map.squareAt(this.travellingUnit.boardLocation).hideUnit = false;
        this.assets.trackCar.hide();
        this.assets.map.clearMovementMap();

        this.assets.mapCursor.moveTo(this.travellingUnit.boardLocation);
        */
    }

    advanceStates = {
       issueOrderStart: {state: IssueOrderStart, pre: () => {
           this.assets.units.traveler = null;
           this.assets.units.target = null;
           this.assets.locations.travelDestination = null;
           MapLayers['top'].sortChildren();
       }}
    }
}