import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { MapLayers } from "../../map/MapLayers";
import { CardinalVector, SumCardinalVectorsToVector, CardinalDirection } from "../../../Common/CardinalDirection";
import { Debug } from "../../../DebugUtils";


export class RatifyIssuedOrder extends TurnState {
    get name(): string { return "RatifyIssuedOrder"; }
    get revertible(): boolean { return false; }
    get skipOnUndo(): boolean { return false; }

    protected advanceStates = {
        checkBoardState: {state: CheckBoardState, pre: () => {}}
    }

    private actor!: UnitObject;
    private location!: Point;
    private destination!: Point;
    private path!: CardinalDirection[];

    protected assert(): void {
        const {map, instruction} = this.assets;
        const get = this.assertData;

        this.location = get(instruction.place, 'location of actor');
        this.actor = get(map.squareAt(this.location).unit, 'unit at location');
        this.path = get(instruction.path, `actor's movement path`);
        this.destination = SumCardinalVectorsToVector(this.path).add(this.location);
        // action
        // which
        // focal
    }

    protected configureScene(): void {
        const {map, instruction} = this.assets;

        // Revert settings set for TrackCar.
        map.squareAt(this.actor.boardLocation).hideUnit = false;

        // Set traveling unit as 'spent' for this turn.
        this.actor.orderable = false;

        // Move traveling unit on the board.
        const moveSuccessful = this.assets.map.moveUnit(this.actor.boardLocation, this.destination);
        this.actor.gas -= map.travelCostForPath(this.location, this.path, this.actor.moveType);
        
        if (moveSuccessful == false) {
            const p1 = this.actor.boardLocation;
            const p2 = this.destination;
            this.throwError(`Move operation was unsuccessful: [Unit ${p1.toString()} '${map.squareAt(p1).unit}' → Unit ${p2.toString()} '${map.squareAt(p2).unit}'] failed.`);
        }

        // If an attack target was selected, compute damage and apply.
        // if (this.action == Action.Attack && this.focal.notEqual(Point.Origin)) {}
        if (false) {
            let damageApply = (attacker: UnitObject, defender: UnitObject) => {
                //let dmg = DamageScript.calculateDamage(attacker, defender);
                //defender.hp -= dmg;

                // TODO Put this in a damage script somewhere
                //let CO = attacker.team.CO;
                let dmg = attacker.baseDamage(defender);
                dmg = Math.ceil(dmg * attacker.hp / 100);   // Always at least 1, unless base was <= 0
                //dmg *= CO.damageModifier(attacker);
                defender.hp -= dmg;

                // TODO
                // if (defender.hp > 0)
                //     defender.damageAnim.trigger();
                // else
                //     defender.destroyedAnim.trigger();
            }

            // Counter-attack check: is target adjacent to attacker?
            let p1 = new Point(traveler.boardLocation);
            let p2 = new Point(attackTarget.boardLocation);
            let distance = p1.subtract(p2).manhattanDistance(Point.Origin);

            // Apply the effects of battle.
            damageApply(traveler, attackTarget);
            if (distance == 1 && attackTarget.hp > 0)
                damageApply(attackTarget, traveler);
        }

        // Update player controls.
        this.assets.mapCursor.teleport(this.actor.boardLocation);

        // Cleanup assets used for issuing order.
        instruction.place = null;
        instruction.path = null;
        instruction.action = null;
        instruction.which = null;
        instruction.focal = null;

        // Advance to next state.
        this.advanceToState(this.advanceStates.checkBoardState);
    }

    update(): void {
        
    }

    prev(): void {
        
    }
}