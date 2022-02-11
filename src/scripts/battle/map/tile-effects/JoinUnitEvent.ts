import { CardinalDirection } from "../../../Common/CardinalDirection";
import { Point } from "../../../Common/Point";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { UnitObject } from "../../UnitObject";
import { MoveUnitEvent } from "./MoveUnitEvent";

interface JoinUnitEventOptions {
  actor: UnitObject;
  path: CardinalDirection[];
  goal: Point;
  other: UnitObject;
  assets: BattleSceneControllers;
}

export class JoinUnitEvent extends MoveUnitEvent {

  protected options: JoinUnitEventOptions;

  constructor(options: JoinUnitEventOptions) {
    super(options);
    this.options = options;
  }

  ratifyMovement() {
    const { players } = this.options.assets;
    const { actor, path, other } = this.options;

    this.ratifySightMapChanges(actor.boardLocation, path);

    // TODO Do I actually not subtract gas before combining gas? wtf
    // I need more consistency between these MoveUnit descendents.

    function roundUp(n: number) { return Math.ceil(n * .10) * 10; }

    const { hp, gas, ammo } = actor;
    const newHp = roundUp(hp) + roundUp(other.hp);
    const extraHp = Math.max(newHp - UnitObject.MaxHp, 0);
    const returnedFunds = extraHp / UnitObject.MaxHp * actor.cost;
    players.current.funds += returnedFunds;

    const highestRank = Math.max(actor.rank, other.rank);
    const CoOnBoard = actor.CoOnBoard || other.CoOnBoard;

    other.hp = newHp;
    other.gas += gas;
    other.ammo += ammo;
    other.rank = highestRank;
    other.CoOnBoard = CoOnBoard;

    actor.destroy();    // Note: this does cascade-call player.handleCoUnitDestroyed()
    other.spent = true;
  }

}