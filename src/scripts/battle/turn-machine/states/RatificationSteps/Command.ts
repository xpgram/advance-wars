import { CardinalDirection, SumCardinalVectorsToVector } from "../../../../Common/CardinalDirection";
import { Point } from "../../../../Common/Point";
import { Instruction } from "../../../EnumTypes";
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
  actor?: UnitObject,
  path?: CardinalDirection[],
  destination?: Point,
  focal?: Point,
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
  get actor() { return assertData(dummyData.actor, `actor object`) },
  get path() { return assertData(dummyData.path, `actor movement path`) },
  get destination() { return assertData(dummyData.destination, `actor movement terminal`) },
  get focal() { return assertData(dummyData.focal, `target location`) },
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
    d.actor = map.squareAt(d.place).unit;
    if (d.path)
      d.destination = SumCardinalVectorsToVector(d.path).add(d.place);
    if (d.destination)
      d.target = map.squareAt(d.destination).unit;
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
      return;
    },
  }

}
