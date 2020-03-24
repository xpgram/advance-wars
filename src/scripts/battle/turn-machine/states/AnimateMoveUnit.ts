import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { CardinalDirection, CardinalVector } from "../../../Common/CardinalDirection";
import { Debug } from "../../../DebugUtils";
import { CommandMenu } from "./CommandMenu";

export class AnimateMoveUnit extends TurnState {
    get name() { return 'AnimateMoveUnit'; }
    get revertible() { return true; }
    get skipOnUndo() { return true; }

    advanceStates = {
        commandMenu: {state: CommandMenu, pre: () => {}}
    }

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
        this.travelPoints = 0;
        while (trackSquare.arrowTo) {
            directions.push(trackSquare.arrowTo);                               // Add new direction
            trackPoint = trackPoint.add(CardinalVector(trackSquare.arrowTo));   // Add directional vector
            trackSquare = this.assets.map.squareAt(trackPoint);                 // Update focused square

            // Tally travel cost——This should be in Ratify, but that means copying this algo somewhere..
            this.travelPoints += this.assets.map.squareAt(trackPoint).terrain.getMovementCost(this.travellingUnit.moveType);

            // Confirm by extreme case that the path leading from traveler does not loop.
            if (this.travelPoints > 200)
                Debug.error("Board arrow-path from source to destination may be looping; 200+ accumulated travel cost.");
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
        // Skip animation on A.press or B.press
        if (this.assets.gamepad.button.A.pressed
            || this.assets.gamepad.button.B.pressed)
            this.assets.trackCar.skip();
        
        // When finished, advance to next state
        if (this.assets.trackCar.finished) {
            this.travellingUnit.gas -= this.travelPoints;   // TODO Move this to RatifyIssuedOrder
            this.battleSystemManager.advanceToState(this.advanceStates.commandMenu);
        }
    }

    prev() {
        this.assets.camera.followTarget = this.assets.mapCursor;
    }
}