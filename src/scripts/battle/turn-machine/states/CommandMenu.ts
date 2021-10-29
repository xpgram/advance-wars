import { TurnState } from "../TurnState";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";
import { AnimateMoveUnit } from "./AnimateMoveUnit";
import { ChooseAttackTarget } from "./ChooseAttackTarget";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { CardinalVector, CardinalDirection, SumCardinalVectorsToVector } from "../../../Common/CardinalDirection";
import { Debug } from "../../../DebugUtils";
import { Unit } from "../../Unit";

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

        // leave trackCar on
        this.assets.trackCar.show();

        // Clean up map UI — hide highlights from irrelevant tiles.
        map.clearTileOverlay();
        map.squareAt(this.location).moveFlag = true;
        map.squareAt(this.destination).moveFlag = true;

        const notIndirectOrNotMoved = (!this.actor.isIndirect || this.destination.equal(this.location));

        // Retain attackable flags as well.
        const range = this.actor.rangeMap;
        const points = range.points.map( p => this.destination.add(p) );
        if (notIndirectOrNotMoved) {
            for (const p of points) {
                if (map.validPoint(p)) {
                    if (map.squareAt(p).attackable(this.actor)) {
                        map.squareAt(p).attackFlag = true;
                        this.enemyInSight = true;
                    }
                }
            }
        }

        // figure out menu options
            // Wait
            // Attack (if unit is attack ready and an attackable target is within range)
            // Build  (if possible)
            // Supply (if Rig and adjacent to allied units)
            // etc.

        // set up command menu  // TODO Refactor this with ListMenuOptions
        const options = [];
        if (this.actor.attackReady && this.enemyInSight && (!this.actor.isIndirect || this.destination.equal(this.location)))
            options.push({text: "Attack", value: 1});
        if (this.actor.soldierUnit && map.squareAt(this.destination).terrain.building)
            options.push({text: "Capture", value: 2});
        if (this.actor.type === Unit.Rig && map.neighborsAt(this.destination).orthogonals.some( square => square.unit?.faction === this.actor.faction ))
            options.push({text: "Supply", value: 3});
        options.push({text: "Wait", value: 0});
        
        this.assets.uiMenu.options = options;


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
        //
        // Problem: 'Supply' also triggers animations. Under the system just
        // described, how would it? I could queue animations and play them
        // during a generic animation state, but that's some work, yo.
        // Not sure I wanna do that right now.
    }

    update(): void {
        const {map, gamepad, instruction} = this.assets;

        // If A, infer next action from uiMenu.
        if (gamepad.button.A.pressed) {
            const commandValue = this.assets.uiMenu.selectedValue;
            instruction.action = commandValue;

            if (commandValue == 1)
                this.advanceToState(this.advanceStates.chooseAttackTarget);
            else
                this.advanceToState(this.advanceStates.animateMoveUnit);
        }

        // If B, cancel, revert state
        else if (gamepad.button.B.pressed) {
            this.regressToPreviousState();
        }
    }

    prev(): void {
        
    }
}