import { CardinalDirection, SumCardinalVectorsToVector } from "../../../../Common/CardinalDirection";
import { Point } from "../../../../Common/Point";
import { DamageScript } from "../../../DamageScript";
import { AttackMethod, Instruction } from "../../../EnumTypes";
import { Square } from "../../../map/Square";
import { TerrainObject } from "../../../map/TerrainObject";
import { Unit } from "../../../Unit";
import { UnitObject } from "../../../UnitObject";
import { BattleSceneControllers } from "../../BattleSceneControllers";

export class RatificationError extends Error {
  name = 'RatificationError';
}

/**  */
const dummyData: {
  assets?: BattleSceneControllers,
  seed?: number,
  action?: Instruction,
  which?: number,
  place?: Point,
  placeTile?: Square,
  placeTerrain?: TerrainObject,
  actor?: UnitObject,
  path?: CardinalDirection[],
  destination?: Point,
  focal?: Point,
  focalTile?: Square,
  focalTerrain?: TerrainObject,
  target?: UnitObject,
} = { };

/**  */
function assertData<T>(data: T | undefined, description: string): T {
  if (data === undefined)
    throw new RatificationError(`Missing data: ${description}`);
  return data;
}

/**  */
const data = {
  // I couldn't come up with a better solution than this.
  get assets() { return assertData(dummyData.assets, `scene assets`) },
  get seed() { return assertData(dummyData.seed, `psuedo-random seed`) },
  get action() { return assertData(dummyData.action, `command serial`) },
  get which() { return assertData(dummyData.which, `command serial variant`) },
  get place() { return assertData(dummyData.place, `source location`) },
  get placeTile() { return assertData(dummyData.placeTile, `square object at source location`) },
  get placeTerrain() { return assertData(dummyData.placeTerrain, `terrain object at source location`) },
  get actor() { return assertData(dummyData.actor, `actor object`) },
  get path() { return assertData(dummyData.path, `actor movement path`) },
  get destination() { return assertData(dummyData.destination, `actor movement terminal`) },
  get focal() { return assertData(dummyData.focal, `target location`) },
  get focalTile() { return assertData(dummyData.focalTile, `square object at target location`) },
  get focalTerrain() { return assertData(dummyData.focalTerrain, `terrain object at target location`) },
  get target() { return assertData(dummyData.target, `target object`) },
}

/**  */
export function fillInstructionData(assets: BattleSceneControllers): void {
  const d = dummyData;

  //@ts-expect-error
  Object.keys(d).forEach( key => d[key] = undefined );

  const { instruction, map } = assets;
  const { seed, action, which, focal, place, path } = instruction;

  // Essential
  d.assets = assets;
  d.seed = seed;
  d.action = action;
  d.which = which;
  d.place = place;
  d.path = path;
  d.focal = focal;

  // Inferables
  if (d.place) {
    d.placeTile = map.squareAt(d.place);
    d.placeTerrain = d.placeTile.terrain;
    d.actor = d.placeTile.unit;
    if (d.path)
      d.destination = SumCardinalVectorsToVector(d.path).add(d.place);
  }
  if (d.focal) {
      d.focalTile = map.squareAt(d.focal);
      d.focalTerrain = d.focalTile.terrain;
      d.target = d.focalTile.unit;
  }
}

/**  */
type CommandObject = {
  name: string,
  triggerInclude: () => boolean,
  ratify: () => void,
}

/**  */
export module Command {

  /** Moves a unit from one board location to another. */
  export const Move: CommandObject = {
    name: "Move",
    triggerInclude: function () {
      return false;
    },
    ratify: function () {
      const { map, scenario } = data.assets;
      const { place, path, destination, actor } = data;

      if (! map.moveUnit(place, destination) )
        throw new RatificationError(`could not move unit ${place.toString()} → ${destination.toString()}`);

      map.squareAt(place).hideUnit = false;
      actor.spent = true;

      if (actor.type !== Unit.Rig || !scenario.rigsInfiniteGas)
        actor.gas -= map.travelCostForPath(place, path, actor.moveType);
    },
  }

  /** Unit idle at location command. */
  export const Wait: CommandObject = {
    name: "Wait",
    triggerInclude: function() {
      const { map } = data.assets;
      return map.squareAt(data.destination).occupiable(data.actor);
    },
    ratify: function() {
      Command.Move.ratify();
    },
  }

  /** Unit attack target from location command. */
  export const Attack: CommandObject = {
    name: "Attack",
    triggerInclude: function() {
      return true;
    },
    ratify: function() {
      Command.Move.ratify();

      const { map } = data.assets;
      const { seed, actor, target } = data;
      const toRemove: UnitObject[] = [];

      function damageApply(attacker: UnitObject, defender: UnitObject, damage: number) {
        if (damage === 0)
          return;
        defender.hp -= damage;
        if (attacker.attackMethodFor(defender) === AttackMethod.Primary)
          attacker.ammo -= 1;
        if (defender.hp === 0)
          toRemove.push(defender);
      }

      const battleResults = DamageScript.NormalAttack(map, actor, target, seed);
      damageApply(actor, target, battleResults.damage);
      damageApply(target, actor, battleResults.counter);

      for (const unit of toRemove)
        unit.destroy();
    }
  }

  /** Unit capture property on board command. */
  export const Capture: CommandObject = {
    name: "Capture",
    triggerInclude: function() {
      return true;
    },
    ratify: function() {
      Command.Move.ratify();

      const { actor, placeTerrain } = data;
      actor.captureBuilding();
      if (actor.buildingCaptured()) {
        actor.stopCapturing();
        placeTerrain.faction = actor.faction;
      }
    },
  }

  /**  */
  export const Supply: CommandObject = {
    name: "Supply",
    triggerInclude: function() {
      return true;
    },
    ratify: function() {
      Command.Move.ratify();

      const { map } = data.assets;
      const { actor } = data;

      map.neighborsAt(actor.boardLocation)
        .orthogonals
        .forEach( square => {
          if (square.unit && square.unit.resuppliable(actor))
            square.unit.resupply();
        });
    }
  }

}
