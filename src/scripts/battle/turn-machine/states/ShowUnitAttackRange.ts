import { TurnState } from "../TurnState";
import { Debug } from "../../../DebugUtils";
import { Point } from "../../../Common/Point";

export class ShowUnitAttackRange extends TurnState {
    get name(): string { return "ShowUnitAttackRange"; }
    get revertible(): boolean { return true; }
    get skipOnUndo(): boolean { return true; }

    protected assert(): void {
        
    }

    protected configureScene(): void {
        Debug.assert((this.assets.locations.focus != null),
            "No location was provided.");

        // Retrieve unit to reveal information for.
        let loc = this.assets.locations.focus as Point;
        let unit = this.assets.map.squareAt(loc).unit;

        Debug.assert((unit != null),
            `No unit was located at ${loc.toString()}`);

        // If there is no unit to look at, just revert.
        if (unit == null) {
            this.battleSystemManager.regressToPreviousState();
            return;
        }

        // Ask map to reveal the unit's attack range.
        this.assets.map.generateAttackRangeMap(unit);

        // Does anything light up red?
        let someAttackableSquare = false;
        for (let y = 0; y < this.assets.map.height; y++)
        for (let x = 0; x < this.assets.map.width; x++) {
            if (this.assets.map.squareAt({x:x,y:y}).attackFlag)
                someAttackableSquare = true;
        }

        // If nothing lights up, show movement range instead
        if (!someAttackableSquare)
            this.assets.map.generateMovementMap(unit);

        // Visual fun: inform the player whom they're looking at, beyond the unit being the center.
        this.assets.trackCar.buildNewAnimation(unit);
        this.assets.trackCar.show();
        this.assets.map.squareAt(loc).hideUnit = true;
    }

    update(): void {
        // Return to previous state when the B button is released.
        if (this.assets.gamepad.button.B.up)
            this.battleSystemManager.regressToPreviousState();
    }
    
    prev(): void {
        this.assets.map.squareAt(this.assets.locations.focus as Point).hideUnit = false;
        this.assets.locations.focus = null;
        this.assets.map.clearMovementMap();
    }

    advanceStates = {

    }
}