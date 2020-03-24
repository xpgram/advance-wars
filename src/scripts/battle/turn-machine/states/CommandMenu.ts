import { TurnState } from "../TurnState";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";

export class CommandMenu extends TurnState {
    get name(): string { return "CommandMenu"; }
    get revertible(): boolean { return true; }
    get skipOnUndo(): boolean { return false; }

    advanceStates = {
        ratifyIssuedOrder: {state: RatifyIssuedOrder, pre: () => {}},

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
    }

    update(): void {
        // If A, assume 'Wait' (until command menu is written)
        if (this.assets.gamepad.button.A.pressed) {
            this.battleSystemManager.advanceToState(this.advanceStates.ratifyIssuedOrder);
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