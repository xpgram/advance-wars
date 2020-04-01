import { TurnState } from "../TurnState";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";
import { AnimateMoveUnit } from "./AnimateMoveUnit";

export class CommandMenu extends TurnState {
    get name(): string { return "CommandMenu"; }
    get revertible(): boolean { return true; }
    get skipOnUndo(): boolean { return false; }

    advanceStates = {
        animateMoveUnit: {state: AnimateMoveUnit, pre: () => {}},

        // TODO Fill these in proper
        attackTarget: {state: RatifyIssuedOrder, pre: () => {}},
        animateBuildingCapture: {state:RatifyIssuedOrder, pre: () => {}}
    }

    protected assert(): void {
        // conditions
    }

    protected configureScene(): void {
        // figure out menu options

        // set up command menu

        // leave trackCar on
        this.assets.trackCar.show();

        // Clean up map UI — hide highlights from irrelevant tiles.
        this.assets.map.clearTileOverlay();     // I need one which doesn't erase the arrow
        let travelerPos = this.assets.units.traveler.boardLocation;
        let destination = this.assets.locations.travelDestination;
        this.assets.map.squareAt(travelerPos).moveFlag = true;
        this.assets.map.squareAt(destination).moveFlag = true;
    }

    update(): void {
        // If A, assume 'Wait' (until command menu is written)
        if (this.assets.gamepad.button.A.pressed) {
            this.battleSystemManager.advanceToState(this.advanceStates.animateMoveUnit);
        }

        // If B, cancel
        else if (this.assets.gamepad.button.B.pressed) {
            this.battleSystemManager.regressToPreviousState();
        }
    }

    prev(): void {
        // 
    }
}