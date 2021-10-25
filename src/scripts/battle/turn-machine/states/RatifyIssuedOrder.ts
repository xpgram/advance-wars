import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { MapLayer } from "../../map/MapLayers";
import { CardinalVector, SumCardinalVectorsToVector, CardinalDirection } from "../../../Common/CardinalDirection";
import { Debug } from "../../../DebugUtils";
import { DamageScript } from "../../DamageScript";
import { AttackMethod } from "../../EnumTypes";


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
    private seed!: number;

    protected assert(): void {
        const get = this.assertData.bind(this);
        const {map, instruction} = this.assets;

        this.location = get(instruction.place, 'location of actor');
        this.actor = get(map.squareAt(this.location).unit, 'unit at location');
        this.path = get(instruction.path, `actor's movement path`);
        this.destination = SumCardinalVectorsToVector(this.path).add(this.location);
        // action
        // which
        // focal
        this.seed = get(instruction.seed, 'seed for turn randomization');
    }

    protected configureScene(): void {
        const {map, instruction} = this.assets;

        // Revert settings set for TrackCar.
        map.squareAt(this.actor.boardLocation).hideUnit = false;

        // Set traveling unit as 'spent' for this turn.
        this.actor.spent = true;

        // Move traveling unit on the board.
        const moveSuccessful = this.assets.map.moveUnit(this.actor.boardLocation, this.destination);
        this.actor.gas -= map.travelCostForPath(this.location, this.path, this.actor.moveType);

        if (moveSuccessful == false) {
            const p1 = this.actor.boardLocation;
            const p2 = this.destination;
            this.failTransition(`Move operation was unsuccessful: [Unit ${p1.toString()} '${map.squareAt(p1).unit}' → Unit ${p2.toString()} '${map.squareAt(p2).unit}'] failed.`);
        }

        // If an attack target was selected, compute damage and apply.
        // if (this.action == Action.Attack && this.focal.notEqual(Point.Origin)) {}
        if (instruction.action == 1) {
            const toRemove: UnitObject[] = [];

            const damageApply = (attacker: UnitObject, defender: UnitObject, dmg: number) => {
                if (dmg == 0)
                    return;

                defender.hp -= dmg;
                
                if (attacker.attackMethodFor(defender) == AttackMethod.Primary)
                    attacker.ammo -= 1;

                if (defender.hp == 0)
                    toRemove.push(defender);
            }

            const targetLoc = this.assertData(instruction.focal, 'location of attack target');
            const target = this.assertData(map.squareAt(targetLoc).unit, 'target unit for attack');

            const battleResults = DamageScript.NormalAttack(map, this.actor, target, this.seed);

            damageApply(this.actor, target, battleResults.damage);
            damageApply(target, this.actor, battleResults.counter);

            for (const unit of toRemove)
                map.destroyUnit(unit.boardLocation);
        }

        // Update player controls.
        this.assets.mapCursor.teleport(this.destination);

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