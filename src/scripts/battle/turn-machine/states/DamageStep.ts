import { TurnState } from "../TurnState";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";
import { UnitObject } from "../../UnitObject";
import { SumCardinalVectorsToVector } from "../../../Common/CardinalDirection";
import { Point } from "../../../Common/Point";


export class CheckBoardState extends TurnState {
    get name(): string { return "CheckBoardState"; }
    get revertible(): boolean { return true; }
    get skipOnUndo(): boolean { return true; }

    protected advanceStates = {
        ratifyIssuedOrder: {state: RatifyIssuedOrder, pre: () => {}}
    }

    private actor!: UnitObject;
    private destination!: Point;
    private target!: UnitObject;    // TODO Meteors?

    protected assert(): void {
        const get = this.assertData;
        const {instruction, map} = this.assets;

        const place = get(instruction.place, 'location of acting unit');
        const focal = get(instruction.focal, 'location of attackable entity');
        const path = get(instruction.path, 'travel path for acting unit');

        this.actor = get(map.squareAt(place).unit, 'acting unit');
        this.target = get(map.squareAt(focal).unit, 'target entity');
        this.destination = SumCardinalVectorsToVector(path).add(place);
    }
    
    protected configureScene(): void {

        const damageApply = (attacker: UnitObject, defender: UnitObject) => {
            //let CO = attacker.team.CO;
            let dmg: number;
            dmg = attacker.baseDamage(defender);
            dmg = Math.ceil(dmg * attacker.hp / 100);   // Always at least 1, unless base was <= 0
            //dmg *= CO.damageModifier(attacker);
            
            defender.hp -= dmg;

            // TODO
            // if (defender.hp > 0)
            //     defender.damageAnim.trigger();
            // else
            //     defender.destroyedAnim.trigger();

            attacker.ammo -= 1;
        }

        // Counter-attack check: is target adjacent to attacker?
        const targetLoc = this.assertData(instruction.focal, 'location of attack target');
        const target = this.assertData(map.squareAt(targetLoc).unit, 'target unit for attack');
        const distance = this.destination.subtract(targetLoc).manhattanDistance(Point.Origin);

        // Apply the effects of battle.
        damageApply(this.actor, target);
        if (distance == 1 && target.hp > 0 && target.canTarget(this.actor))
                damageApply(target, this.actor);
    }

    update(): void {

    }

    prev(): void {

    }
}