import { Point } from "../../../Common/Point";
import { DamageScript } from "../../DamageScript";
import { UnitClass } from "../../EnumTypes";
import { AirExplosionEvent } from "../../map/tile-effects/AirExplosionEvent";
import { GroundExplosionEvent } from "../../map/tile-effects/GroundExplosionEvent";
import { UnitObject } from "../../UnitObject";
import { Command } from "../Command";
import { TurnState } from "../TurnState";

export class AnimateBattle extends TurnState {
  get type() { return AnimateBattle; }
  get name(): string { return "AnimateBattle"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  configureScene(): void {
    const { map } = this.assets;
    const { action } = this.data;

    // Determine and emit blow-up events for units.
    if (action === Command.Attack.serial) {
      const { actor, goal, target, seed } = this.data;

      function emit(unit: UnitObject, location: Point) {
        (unit.unitClass === UnitClass.Ground)
          ? new GroundExplosionEvent({location})
          : new AirExplosionEvent({location});
      }

      const battleResults = DamageScript.NormalAttack(map, actor, goal, target, seed);

      if (target.hp - battleResults.damage <= 0) emit(target, target.boardLocation);
      if (actor.hp - battleResults.counter <= 0) emit(actor, goal);
    }

    this.advance();
  }

}