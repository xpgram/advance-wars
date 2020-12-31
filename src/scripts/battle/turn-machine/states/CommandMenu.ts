import { TurnState } from "../TurnState";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";
import { AnimateMoveUnit } from "./AnimateMoveUnit";
import { ChooseAttackTarget } from "./ChooseAttackTarget";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { CardinalVector, CardinalDirection, SumCardinalVectorsToVector } from "../../../Common/CardinalDirection";
import { Debug } from "../../../DebugUtils";

export class CommandMenu extends TurnState {
    get name(): string { return "CommandMenu"; }
    get revertible(): boolean { return true; }
    get skipOnUndo(): boolean { return false; }

    advanceStates = {
        animateMoveUnit: {state: AnimateMoveUnit, pre: () => {}},

        // TODO Fill these in proper
        chooseAttackTarget: {state: ChooseAttackTarget, pre: () => {}},
        animateBuildingCapture: {state: RatifyIssuedOrder, pre: () => {}}
    }

    private location!: Point;
    private destination!: Point;
    private actor!: UnitObject;
    private path!: CardinalDirection[];

    protected assert(): void {
        const get = this.assertData;
        const {map, instruction} = this.assets;
        
        this.location = get(instruction.place, 'location of unit');
        this.actor = get(map.squareAt(this.location).unit, `unit at location ${this.location.toString()}`);
        this.path = get(instruction.path, 'travel path for unit');
        this.destination = SumCardinalVectorsToVector(this.path).add(this.location);
    }

    protected configureScene(): void {
        const {map} = this.assets;

        // figure out menu options
            // Wait
            // Attack (if unit is attack ready and an attackable target is within range)
            // Build  (if possible)
            // Supply (if Rig and adjacent to allied units)
            // etc.

        // set up command menu

        // leave trackCar on
        this.assets.trackCar.show();

        // Clean up map UI — hide highlights from irrelevant tiles.
        map.clearTileOverlay();
        map.squareAt(this.location).moveFlag = true;
        map.squareAt(this.destination).moveFlag = true;
    }

    update(): void {
        const {gamepad} = this.assets;

        // If A, assume 'Wait' (until command menu is written)
        if (gamepad.button.A.pressed) {
            this.advanceToState(this.advanceStates.animateMoveUnit);
        }

        // If X, assume 'Attack' (until command menu is written), but only if capable
        if (gamepad.button.X.pressed) {
            if (this.actor.attackReady)
                this.advanceToState(this.advanceStates.chooseAttackTarget);

            // 'Attack' I believe doesn't show up unless an attackable unit is in range.

            // I am *finally* in a position where I can start adding the attack stuff.
            // I needed to cleanup/re-understand how the scripting system worked
            // as well as refactor a couple things to make inter-state communication,
            // like where the unit is moving to, easier to relate.
            // I have not rewritten all TurnStates to conform to the new standard yet, though.
        }

        // If B, cancel
        else if (gamepad.button.B.pressed) {
            this.regressToPreviousState();
        }
    }

    prev(): void {
        
    }
}