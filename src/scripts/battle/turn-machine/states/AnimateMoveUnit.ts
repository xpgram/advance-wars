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

    private traveller!: UnitObject;
    private travelPath!: CardinalDirection[];

    assert() {
        const get = this.assertData;
        const {instruction, map} = this.assets;

        const place = get(instruction.place, 'Board location for Unit');
        this.traveller = get(map.squareAt(place).unit, 'Unit');
        this.travelPath = get(instruction.path, 'Travel path');
    }

    configureScene() {
        // Reset track car's animation and show it
        this.assets.trackCar.buildNewAnimation(this.traveller);
        this.assets.trackCar.directions = this.travelPath;
        this.assets.trackCar.show();

        // Set camera to follow the car
        this.assets.camera.followTarget = this.assets.trackCar;

        // Clear markings from the board
        this.assets.map.clearMovementMap();

        // Animation start
        this.assets.trackCar.start();
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
            this.advanceToState(this.advanceStates.ratifyIssuedOrder);
    }

    prev() {
        this.assets.camera.followTarget = this.assets.mapCursor;
    }
}