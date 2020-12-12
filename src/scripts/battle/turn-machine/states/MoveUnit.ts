import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { CommandMenu } from "./CommandMenu";
import { CardinalDirection } from "../../../Common/CardinalDirection";

export class MoveUnit extends TurnState {
    get name() { return 'MoveUnit'; }
    get revertible() { return true; }
    get skipOnUndo() { return false; }

    private travellingUnit!: UnitObject;
    private lastCursorPos = new Point(-1, -1);

    assert() {
        this.travellingUnit = this.assertData(this.assets.units.traveler, 'unit to move');
    }

    configureScene() {
        this.assets.mapCursor.show();
        this.assets.uiSystem.show();

        // Hide unit's map sprite
        let square = this.assets.map.squareAt(this.travellingUnit.boardLocation);
        square.hideUnit = true;

        // Show the unit's trackcar
        this.assets.trackCar.buildNewAnimation(this.travellingUnit);
        this.assets.trackCar.show();

        // Generate movement map
        this.assets.map.generateMovementMap(this.travellingUnit);
    }

    update() {
        // Request a recalc of the travel path on cursor move
        if (this.lastCursorPos.notEqual(this.assets.mapCursor.pos)) {
            this.lastCursorPos = new Point(this.assets.mapCursor.pos);
            this.assets.map.recalculatePathToPoint(this.travellingUnit, this.lastCursorPos);
        }

        // On press B, revert state
        if (this.assets.gamepad.button.B.pressed)
            this.battleSystemManager.regressToPreviousState();
        
        // On press A and viable location, advance state
        else if (this.assets.gamepad.button.A.pressed
            && this.assets.map.squareAt(this.lastCursorPos).moveFlag == true
            && this.assets.map.squareAt(this.lastCursorPos).occupiable(this.assets.units.traveler as UnitObject)) {

            this.assets.locations.travelDestination = new Point(this.lastCursorPos);
            this.battleSystemManager.advanceToState(this.advanceStates.commandMenu);
        }
    }

    prev() {
        this.assets.map.squareAt(this.travellingUnit.boardLocation).hideUnit = false;
        this.assets.trackCar.hide();
        this.assets.map.clearMovementMap();
        this.assets.mapCursor.moveTo(this.travellingUnit.boardLocation);
    }

    advanceStates = {
        commandMenu: {state: CommandMenu, pre: () => {} }
    }
}