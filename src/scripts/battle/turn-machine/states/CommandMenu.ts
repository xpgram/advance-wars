import { TurnState } from "../TurnState";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";
import { AnimateMoveUnit } from "./AnimateMoveUnit";
import { ChooseAttackTarget } from "./ChooseAttackTarget";
import { AssertionError } from "assert";

export class CommandMenu extends TurnState {
    get name(): string { return "CommandMenu"; }
    get revertible(): boolean { return true; }
    get skipOnUndo(): boolean { return false; }

    advanceStates = {
        animateMoveUnit: {state: AnimateMoveUnit, pre: () => {}},

        // TODO Fill these in proper
        chooseAttackTarget: {state: ChooseAttackTarget, pre: () => {}},
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
        this.assets.map.clearTileOverlay();
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

        // If X, assume 'Attack' (until command menu is written), but only if capable
        if (this.assets.gamepad.button.X.pressed) {
            if (this.assets.units.traveler.attackReady)
                this.battleSystemManager.advanceToState(this.advanceStates.chooseAttackTarget);

            // 'Attack' I believe doesn't show up unless an attackable unit is in range.
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