import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { CommandMenu } from "./CommandMenu";
import { TileInspector } from "../../map/TileInspector";

export class MoveUnit extends TurnState {
    get name() { return 'MoveUnit'; }
    get revertible() { return true; }
    get skipOnUndo() { return false; }

    private location!: Point;
    private travellingUnit!: UnitObject;
    private lastCursorPos = new Point(-1, -1);

    assert() {
        this.location = this.assertData(this.assets.instruction.place, 'location of unit to move');
        this.travellingUnit = this.assertData(this.assets.map.squareAt(this.location).unit, 'unit to move');
    }

    configureScene() {
        this.assets.mapCursor.show();
        this.assets.uiSystem.show();

        // Hide unit's map sprite
        let square = this.assets.map.squareAt(this.location);
        square.hideUnit = true;

        // Show the unit's trackcar
        this.assets.trackCar.buildNewAnimation(this.travellingUnit);
        this.assets.trackCar.show();

        // Generate movement map
        this.assets.map.generateMovementMap(this.travellingUnit);
    }

    update() {
        const {map, mapCursor, gamepad, instruction} = this.assets;

        // On press B, revert state
        if (gamepad.button.B.pressed)
            this.regressToPreviousState();

        // If the unit is not owned by current player, do nothing else
        if (this.assets.players.current.faction !== this.travellingUnit.faction)
            return;

        // Request a recalc of the travel path on cursor move
        if (this.lastCursorPos.notEqual(mapCursor.pos)) {
            this.lastCursorPos = new Point(mapCursor.pos);
            map.recalculatePathToPoint(this.travellingUnit, this.lastCursorPos);
        }
        
        // On press A and viable location, advance state
        else if (gamepad.button.A.pressed
            && map.squareAt(this.lastCursorPos).moveFlag == true
            && map.squareAt(this.lastCursorPos).occupiable(this.travellingUnit)) {

            instruction.path = map.pathFrom(this.location);
            this.advanceToState(this.advanceStates.commandMenu);
        }
    }

    prev() {
        this.assets.map.squareAt(this.location).hideUnit = false;
        this.assets.trackCar.hide();
        this.assets.map.clearMovementMap();
        this.assets.mapCursor.moveTo(this.location);
    }

    advanceStates = {
        commandMenu: {state: CommandMenu, pre: () => {} }
    }
}