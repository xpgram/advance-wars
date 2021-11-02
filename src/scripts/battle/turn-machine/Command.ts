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

/** Container which holds commonly requested field information and object
 * references, if they are acquirable. */
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

/** Asserts data exists and returns it.
 * @throws RatificationError if data is undefined. */
function assertData<T>(data: T | undefined, description: string): T {
  if (data === undefined)
    throw new RatificationError(`Missing data: ${description}`);
  return data;
}

/** Access to getters for commonly requested field information and object references.
 * @throws RatificationError if requested information does not exist. */
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

/** Updates the CommandObject system with new instruction data.
 * Must be called before retriggering or ratifying any changes. */
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

/** Interface all Commands must adhere to. */
type CommandObject = {
  /** Name string; use as menu option title. */
  name: string,
  /** Command identification serial. */
  serial: number,
  /** Returns true if this command should be included in a ListMenu. */
  triggerInclude: () => boolean,
  /** Effects changes on the board. */
  ratify: () => void,
}

/** Global container for Command objects and logic. */
export module Command {

  /** Unit idle at location command. */
  export const Wait: CommandObject = {
    name: "Wait",
    serial: 0,
    triggerInclude() {
      const { map } = data.assets;
      return map.squareAt(data.destination).occupiable(data.actor);
    },
    ratify() {
      Command.Move.ratify();
    },
  }

  /** Moves a unit from one board location to another. */
  export const Move: CommandObject = {
    name: "Move",
    serial: 1,
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

  /** Unit attack target from location command. */
  export const Attack: CommandObject = {
    name: "Attack",
    serial: 2,
    triggerInclude() {
      const { map } = data.assets;
      const { actor, place, destination } = data;

      // Determine if an attackable enemy is present
      let enemyInSight = false;
      const area = map.squareOfInfluence(actor);
      for (let y = area.y; y < area.height; y++)
      for (let x = area.x; x < area.width; x++) {
        if (map.squareAt({x,y}).attackFlag)
          enemyInSight = true;
      }

      // Other checks
      const targetableInRange = actor.attackReady && enemyInSight;
      const notIndirect = (!actor.isIndirect);
      const hasNotMoved = (destination.equal(place));
      return targetableInRange && (notIndirect || hasNotMoved);
    },
    ratify() {
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
    serial: 3,
    triggerInclude() {
      const { actor, placeTerrain } = data;
      const readyToCapture = (actor.soldierUnit && placeTerrain.building);
      const notAllied = (actor.faction !== placeTerrain.faction);
      return readyToCapture && notAllied;
    },
    ratify() {
      Command.Move.ratify();

      const { actor, placeTerrain } = data;
      actor.captureBuilding();
      if (actor.buildingCaptured()) {
        actor.stopCapturing();
        placeTerrain.faction = actor.faction;
      }
    },
  }

  /** Unit supplies resources to adjacent allies command. */
  export const Supply: CommandObject = {
    name: "Supply",
    serial: 4,
    triggerInclude() {
      const { map } = data.assets;
      const { actor, destination } = data;
      return map
        .neighborsAt(destination)
        .orthogonals
        .some( square => square.unit && square.unit.resuppliable(actor) );
    },
    ratify() {
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

  /** Unit combines with allied unit at destination command. */
  export const Join: CommandObject = {
    name: "Join",
    serial: 5,
    triggerInclude() {
      const { map } = data.assets;
      const { actor, destination } = data;

      const other = map.squareAt(destination).unit;
      if (!other)
        return false;

      const notSelf = (actor !== other);
      const sameType = (actor.type === other.type);
      const sameFaction = (actor.faction === other.faction);
      const bothOrderable = (!actor.spent && !other.spent);
      const oneRepairable = (actor.repairable || other.repairable);
      return notSelf && sameType && sameFaction && bothOrderable && oneRepairable;
    },
    ratify() {
      const { map, players } = data.assets;
      const { actor, destination } = data;

      const other = map.squareAt(destination).unit;
      if (!other)
        throw new RatificationError(`no unit to join with`);
      if (other.faction !== actor.faction)
        throw new RatificationError(`units to join are not allied`);
      if (other.type !== actor.type)
        throw new RatificationError(`units to join are not of same type`);

      const { hp, gas, ammo } = actor;
      const extraHp = Math.max(hp + other.hp - UnitObject.MaxHp, 0);
      const returnedFunds = extraHp / UnitObject.MaxHp * actor.cost;
      players.current.funds += returnedFunds;

      other.hp += hp;
      other.gas += gas;
      other.ammo += ammo;

      actor.destroy();
      other.spent = true;
    },
  }

  /** Unit spawns at location action. */
  export const SpawnUnit: CommandObject = {
    name: "SpawnUnit",
    serial: 6,
    triggerInclude() {
      return false;
    },
    ratify() {
      const { players } = data.assets;
      const { which, place } = data;

      const unit = players.current.spawnUnit({
        location: place,
        serial: which,
        spent: true,
      });
      players.current.expendFunds(unit.cost);
    },
  }
}
