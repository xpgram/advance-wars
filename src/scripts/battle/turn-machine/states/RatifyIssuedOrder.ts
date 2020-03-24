import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { MapLayers } from "../../MapLayers";


export class RatifyIssuedOrder extends TurnState {
    get name(): string { return "RatifyIssuedOrder"; }
    get revertible(): boolean { return false; }
    get skipOnUndo(): boolean { return false; }

    protected advanceStates = {
        checkBoardState: {state: CheckBoardState, pre: () => {}}
    }

    protected assert(): void {
        if (this.assets.units.traveler == null)
            this.throwError("Traveling unit ")
    }

    protected configureScene(): void {

        let traveler = this.assets.units.traveler as UnitObject;
        let destinationPoint = this.assets.locations.travelDestination as Point;
        let attackTarget = this.assets.units.target;

        let oldLoc = this.assets.map.squareAt(traveler.boardLocation);
        let newLoc = this.assets.map.squareAt(destinationPoint);

        // Move traveling unit on the board.
        oldLoc.hideUnit = false;    // Cleanup settings left by TrackCar.
        traveler.orderable = false; // Set traveling unit as 'spent' for this turn.
        traveler.visible = true;    // TODO Remove (refactor Square.hideUnit)

        let moveSuccessful = this.assets.map.moveUnit(traveler.boardLocation, destinationPoint);
        if (moveSuccessful == false)
            this.throwError(`Move operation was unsuccessful: [Unit (${oldLoc.x},${oldLoc.y}) '${oldLoc.unit}' → Unit (${newLoc.x},${newLoc.y}) '${newLoc.unit}'] failed.w`);

        // If an attack target was selected, compute damage and apply.
        if (attackTarget) {
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
            let distance = p1.subtract(p2).taxicabDistance(Point.Origin);

            // Apply the effects of battle.
            damageApply(traveler, attackTarget);
            if (distance == 1 && attackTarget.hp > 0)
                damageApply(attackTarget, traveler);
        }

        // Update player controls.
        this.assets.mapCursor.teleport(traveler.boardLocation);

        // Cleanup assets used for issuing order.
        this.assets.units.traveler = null;
        this.assets.units.target = null;
        this.assets.locations.travelDestination = null;

        // Advance to next state.
        this.battleSystemManager.advanceToState(this.advanceStates.checkBoardState);
    }

    update(): void {
        
    }

    prev(): void {
        
    }
}