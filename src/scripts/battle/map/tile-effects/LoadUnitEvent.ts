import { CardinalDirection } from "../../../Common/CardinalDirection";
import { Point } from "../../../Common/Point";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { Unit } from "../../Unit";
import { UnitObject } from "../../UnitObject";
import { MoveUnitEvent } from "./MoveUnitEvent";

interface LoadUnitEventOptions {
  actor: UnitObject;
  path: CardinalDirection[];
  goal: Point,
  underneath: UnitObject;
  assets: BattleSceneControllers;
}

export class LoadUnitEvent extends MoveUnitEvent {

  protected options: LoadUnitEventOptions;

  constructor(options: LoadUnitEventOptions) {
    super(options);
    this.options = options;
  }

  ratifyMovement() {
    const { map, scenario } = this.options.assets;
    const { actor, path, underneath } = this.options;

    this.ratifySightMapChanges(actor.boardLocation, path);

    actor.expendTravelGas(map.travelCostForPath(actor.boardLocation, path, actor.moveType));

    map.removeUnit(actor.boardLocation);
    underneath.loadUnit(actor);
    actor.spent = true;
  }

}