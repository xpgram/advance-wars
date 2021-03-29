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
    
    private enemyInSight = false;

    protected assert(): void {
        const get = this.assertData.bind(this);
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
        this.assets.uiMenu.options = [
            {text: "Attack", value: 0},
            {text: "Wait", value: 1},
        ]
        const location = (new Point(this.assets.mapCursor.transform.pos)).add(new Point(20,4));
        this.assets.uiMenu.transform.pos = location;
        this.assets.uiMenu.show();

        // TODO unit.commands should be how the selectables are determined.
        // Maybe commands returns a name/script pair? value = script.
        // Then, the units themselves can codify how many options they have,
        // when they present themselves, and what they do after selection.
        //
        // Units have a reference to map, don't they? They might not.
        // I guess they will.


        // leave trackCar on
        this.assets.trackCar.show();

        // Clean up map UI — hide highlights from irrelevant tiles.
        map.clearTileOverlay();
        map.squareAt(this.location).moveFlag = true;
        map.squareAt(this.destination).moveFlag = true;

        // Retain attackable flags as well.
        const range = this.actor.rangeMap;
        const points = range.points.map( p => this.destination.add(p) );
        for (const p of points) {
            if (map.validPoint(p)) {
                if (map.squareAt(p).attackable(this.actor)) {
                    map.squareAt(p).attackFlag = true;
                    this.enemyInSight = true;
                }
            }
        }
    }

    update(): void {
        const {map, gamepad, instruction} = this.assets;

        // If A, assume 'Wait' (until command menu is written)
        if (gamepad.button.A.pressed) {
            this.advanceToState(this.advanceStates.animateMoveUnit);
        }

        // If X, assume 'Attack' (until command menu is written), but only if capable
        if (gamepad.button.X.pressed) {
            if (this.actor.attackReady && this.enemyInSight) {
                instruction.action = 1; // TODO Setup action enum
                this.advanceToState(this.advanceStates.chooseAttackTarget);
            }
        }

        // If B, cancel, revert state
        else if (gamepad.button.B.pressed) {
            this.regressToPreviousState();
        }
    }

    prev(): void {
        
    }
}