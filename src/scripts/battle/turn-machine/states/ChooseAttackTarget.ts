import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { Slider } from "../../../Common/Slider";
import { AnimateMoveUnit } from "./AnimateMoveUnit";
import { SumCardinalVectorsToVector } from "../../../Common/CardinalDirection";
import { Debug } from "../../../DebugUtils";

export class ChooseAttackTarget extends TurnState {
    get name() { return 'ChooseAttackTarget'; }
    get revertible() { return true; }
    get skipOnUndo() { return false; }

    private actor!: UnitObject;
    private destination!: Point;
    private possibleTargets: UnitObject[] = [];
    private index!: Slider;

    assert() {
        const get = this.assertData;
        const {instruction, map} = this.assets;

        const place = get(instruction.place, 'location of acting unit');
        this.actor = get(map.squareAt(place).unit, `acting unit at location ${place.toString()}`);
        const path = get(instruction.path, 'travel instructions for unit');
        this.destination = SumCardinalVectorsToVector(path).add(place);
    }

    configureScene() {
        const {map, mapCursor} = this.assets;

        mapCursor.show();
        mapCursor.disable();
        this.assets.uiSystem.show();
        this.assets.trackCar.show();

        // Build the list of possible targets
        const boundary = map.squareOfInfluence(this.actor);
        for (let yi = 0; yi < boundary.height; yi++)
        for (let xi = 0; xi < boundary.width; xi++) {
            const x = xi + boundary.x;
            const y = yi + boundary.y;
            const square = map.squareAt(new Point(x,y));
            if (square.unit && square.attackFlag)
                this.possibleTargets.push(square.unit);
        }

        // If there are no targets, revert to last state; otherwise,
        if (this.possibleTargets.length == 0)
            this.regressToPreviousState();
        // ...setup the target-picker and move the cursor.
        else {
            this.index = new Slider({
                max: this.possibleTargets.length,
                granularity: 1,
                looping: true
            });
            this.assets.mapCursor.teleport(this.possibleTargets[this.index.output].boardLocation);
        }
    }

    update() {
        const {gamepad, mapCursor, instruction} = this.assets;

        if (gamepad.button.dpadUp.pressed
          || gamepad.button.dpadLeft.pressed) {
            this.index.decrement();
            mapCursor.teleport(this.possibleTargets[this.index.output].boardLocation);
        }
        else if (gamepad.button.dpadDown.pressed
          || gamepad.button.dpadRight.pressed) {
            this.index.increment();
            mapCursor.teleport(this.possibleTargets[this.index.output].boardLocation);
        }
        else if (gamepad.button.B.pressed)
            this.regressToPreviousState();
        else if (gamepad.button.A.pressed) {
            instruction.focal = this.possibleTargets[this.index.output].boardLocation;
            this.advanceToState(this.advanceStates.animateMoveUnit);
        }
    }

    prev() {
        this.assets.instruction.focal = null;
        this.assets.mapCursor.moveTo(this.destination);
    }

    advanceStates = {
        animateMoveUnit: {state: AnimateMoveUnit, pre: () => {} }
    }
}