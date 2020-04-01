import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { CardinalDirection, CardinalVector } from "../../../Common/CardinalDirection";
import { Debug } from "../../../DebugUtils";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";

export class AnimateMoveUnit extends TurnState {
    get name() { return 'AnimateMoveUnit'; }
    get revertible() { return true; }
    get skipOnUndo() { return true; }

    advanceStates = {
        ratifyIssuedOrder: {state: RatifyIssuedOrder, pre: () => {}}
    }

    travellingUnit!: UnitObject;
    travelDestination!: Point;

    assert() {
        if (this.assets.units.traveler == null)
            this.throwError("Missing UnitObject for unit movement animation step.")
        if (this.assets.locations.travelDestination == null)
            this.throwError("No board location provided for unit destination.");
    }

    configureScene() {
        this.travellingUnit = this.assets.units.traveler as UnitObject;
        this.travelDestination = this.assets.locations.travelDestination as Point;

        // Reset track car's animation and show it
        this.assets.trackCar.buildNewAnimation(this.travellingUnit);
        this.assets.trackCar.show();

        // Set camera to follow the car
        this.assets.camera.followTarget = this.assets.trackCar;

        // Build the track the TrackCar will follow
        let trackPoint = new Point(this.travellingUnit.boardLocation);  // The point being looked at
        let trackSquare = this.assets.map.squareAt(trackPoint);         // The square at trackPoint
        let directions: CardinalDirection[] = [];                       // Cumulative list of cardinal directions.

        // Follow the arrow path leading from the traveler, tallying the travel cost along the way
        this.assets.travelCost = 0;
        while (trackSquare.arrowTo) {
            directions.push(trackSquare.arrowTo);                               // Add new direction
            trackPoint = trackPoint.add(CardinalVector(trackSquare.arrowTo));   // Add directional vector
            trackSquare = this.assets.map.squareAt(trackPoint);                 // Update focused square

            // Keep track of calculated travel cost for gas expenditure later and for debugging.
            this.assets.travelCost += trackSquare.terrain.getMovementCost(this.travellingUnit.moveType);

            // Confirm by extreme case that the path leading from traveler does not loop.
            // If it does, abort the travel operation.
            if (this.assets.travelCost > 200) {
                Debug.assert(false, "Board arrow-path from source to destination may be looping; 200+ steps.");
                this.battleSystemManager.regressToPreviousState();
                break;
            }
        }

        // Confirm that travel destination and path end are the same board location.
        Debug.assert((this.travelDestination.equal(trackSquare)),
            `TrackCar's travel path does not end in its destination: ${this.travelDestination.toString()} → ${(new Point(trackSquare)).toString()}`);

        // Give travel directions to TrackCar and rev those engines
        this.assets.trackCar.directions = directions;
        this.assets.trackCar.start();

        // Clear markings from the board
        this.assets.map.clearMovementMap();
    }

    update() {
        // Speed up animation on A.press or B.press
        // if (this.assets.gamepad.button.A.down
        //     || this.assets.gamepad.button.B.down)
        //     this.assets.trackCar.speed = 11;
        // else
        //     this.assets.trackCar.speed = 7;
        
        // When finished, advance to next state
        if (this.assets.trackCar.finished)
            this.battleSystemManager.advanceToState(this.advanceStates.ratifyIssuedOrder);
    }

    prev() {
        this.assets.travelCost = 0;
        this.assets.camera.followTarget = this.assets.mapCursor;
    }
}