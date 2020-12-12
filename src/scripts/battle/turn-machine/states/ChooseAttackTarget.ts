import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { Slider } from "../../../Common/Slider";
import { AnimateMoveUnit } from "./AnimateMoveUnit";

export class ChooseAttackTarget extends TurnState {
    get name() { return 'ChooseAttackTarget'; }
    get revertible() { return true; }
    get skipOnUndo() { return false; }

    private possibleTargets: UnitObject[] = [];
    private index!: Slider;

    assert() {
        if (this.assets.units.traveler == null)
            this.throwError("Missing UnitObject for choose attack target step.")
    }

    configureScene() {
        this.assets.mapCursor.show();
        this.assets.mapCursor.disable();
        this.assets.uiSystem.show();
        this.assets.trackCar.show();

        // Build the list of possible targets
        const traveller = this.assets.units.traveler as UnitObject;
        // This needs to be a collection of in-range locations *from the travel destination*.
        // Especially because during this step no targets are still red anyway.
        const boundary = this.assets.map.squareOfInfluence(traveller);
        for (let xi = 0; xi < boundary.width; xi++)
        for (let yi = 0; yi < boundary.height; yi++) {
            const x = xi + boundary.x;
            const y = yi + boundary.y;
            const square = this.assets.map.squareAt(new Point(x,y));
            if (square.unit && square.attackFlag)
                this.possibleTargets.push(square.unit);
        }

        // If there are no targets, revert to last state; otherwise,
        if (this.possibleTargets.length == 0)
            this.battleSystemManager.regressToPreviousState();
        else {
            // setup the target-picker and move the cursor.
            this.index = new Slider({
                max: this.possibleTargets.length - 1,
                granularity: 1,
                looping: true
            });
            this.assets.mapCursor.teleport(this.possibleTargets[this.index.output].boardLocation);
        }
    }

    update() {
        if (this.assets.gamepad.button.dpadUp.pressed
          || this.assets.gamepad.button.dpadLeft.pressed) {
            this.index.decrement();
            this.assets.mapCursor.teleport(this.possibleTargets[this.index.output].boardLocation);
        }
        else if (this.assets.gamepad.button.dpadDown.pressed
          || this.assets.gamepad.button.dpadRight.pressed) {
            this.index.increment();
            this.assets.mapCursor.teleport(this.possibleTargets[this.index.output].boardLocation);
        }
        else if (this.assets.gamepad.button.B.pressed)
            this.battleSystemManager.regressToPreviousState();
        else if (this.assets.gamepad.button.A.pressed) {
            this.assets.units.target = this.possibleTargets[this.index.output];
            this.battleSystemManager.advanceToState(this.advanceStates.animateMoveUnit);
        }
    }

    prev() {
        this.assets.units.target = null;
        this.assets.mapCursor.moveTo(this.assets.locations.travelDestination);
    }

    advanceStates = {
        animateMoveUnit: {state: AnimateMoveUnit, pre: () => {} }
    }
}