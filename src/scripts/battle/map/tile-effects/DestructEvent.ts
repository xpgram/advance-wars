import { TrackCar } from "../../TrackCar";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { UnitObject } from "../../UnitObject";
import { BattleDamageEvent } from "./BattleDamageEvent";

interface DestructEventOptions {
  unit: UnitObject;
  trackCar: TrackCar;
  assets: BattleSceneControllers;
}

/** This is a duplicate of BattleDamageEvent that simply has no attacker and deals
 * unit.hp damage to the unit. It thus uses all the same vfx that DamageEvent does. */
export class DestructEvent extends BattleDamageEvent {

  constructor(options: DestructEventOptions) {
    super({
      defender: options.unit,
      damage: options.unit.hp,
      assets: options.assets,
    });
  }

}