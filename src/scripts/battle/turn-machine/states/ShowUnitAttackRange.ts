import { TurnState } from "../TurnState";
import { Point } from "../../../Common/Point";
import { Game } from "../../../..";
import { UnitObject } from "../../UnitObject";

const EXIT_FRAME_DELAY = 2;

export class ShowUnitAttackRange extends TurnState {
    get name(): string { return "ShowUnitAttackRange"; }
    get revertible(): boolean { return true; }
    get skipOnUndo(): boolean { return true; }

    private location!: Point;
    private unit!: UnitObject;

    protected assert(): void {
        this.location = this.assertData(this.assets.instruction.place, 'Unit Location');
        this.unit = this.assertData(this.assets.map.squareAt(this.location).unit, `No unit at ${this.location.toString()}`);
    }

    protected configureScene(): void {
        if (this.unit.attackReady) {
            // Unit has an attack range, prepare to display it.
            this.assets.map.generateAttackRangeMap(this.unit);
            // TrackCar is a visual cue that this unit is being examined.
            this.assets.trackCar.buildNewAnimation(this.unit);
            this.assets.trackCar.show();
            this.assets.map.squareAt(this.location).hideUnit = true;
        } else {
            // No attack range: on small delay, return to previous state.
            const frameSchedule = Game.frameCount + EXIT_FRAME_DELAY;
            Game.workOrders.send( () => {
                if (Game.frameCount == frameSchedule) {
                    if (this.battleSystemManager)   // Protection against this state's closing before the timer ends.
                        this.battleSystemManager.regressToPreviousState(this);
                        // TODO regress() and advance() should do nothing unless currentState is this state.
                    return true;
                }
            }, this);
        }
    }

    update(): void {
        // On press B, return to previous state.
        if (this.assets.gamepad.button.B.up)
            this.battleSystemManager.regressToPreviousState(this);
    }
    
    prev(): void {
        this.assets.map.squareAt(this.location).hideUnit = false;
        this.assets.map.clearMovementMap();
    }

    advanceStates = {

    }
}