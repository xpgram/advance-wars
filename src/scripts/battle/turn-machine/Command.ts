import { DamageScript } from "../DamageScript";
import { AttackMethod } from "../EnumTypes";
import { Unit } from "../Unit";
import { UnitObject } from "../UnitObject";
import { instructionData } from "./InstructionData";


const { data } = instructionData;

export class RatificationError extends Error {
  name = 'RatificationError';
}

/** Returns a CommandObject corrosponding to the given serial number. */
export function getCommandObject(serial: number): CommandObject {
  const command = Object.values(Command).find( c => c.serial === serial );
  if (!command)
    throw new Error(`could not retrieve command object for serial ${serial}`);
  return command;
}

/** Names for sorting weight categories. */
enum Weight {
  Primary,    // First order abilities: Attack
  Secondary,  // Unit specific special actions.
  Tertiary,   // Contextual, global actions.
  Quaternary, // -
  Bottom,     // Last in list: Wait
  None,       // Not sequentially, but indicates an item whose sort is irrelevant.
}

/** Interface all Commands must adhere to. */
export type CommandObject = {
  /** Name string; use as menu option title. */
  name: string,
  /** Command identification serial. */
  serial: number,
  /** Sort order value. */
  weight: number,
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
    weight: Weight.Bottom,
    triggerInclude() {
      const { actor, goalTile } = data;
      return goalTile.occupiable(actor);
    },
    ratify() {
      Command.Move.ratify();
    },
  }

  /** Moves a unit from one board location to another. */
  export const Move: CommandObject = {
    name: "Move",
    serial: 1,
    weight: Weight.None,
    triggerInclude: function () {
      return false;
    },
    ratify: function () {
      const { map, scenario } = data.assets;
      const { place, path, goal, actor } = data;

      if (place.notEqual(goal))
        if (! map.moveUnit(place, goal) )
          throw new RatificationError(`could not move unit ${place.toString()} → ${goal.toString()}`);
      
      actor.spent = true;
      if (actor.type !== Unit.Rig || !scenario.rigsInfiniteGas)
        actor.gas -= map.travelCostForPath(place, path, actor.moveType);
    },
  }

  /** Unit attack target from location command. */
  export const Attack: CommandObject = {
    name: "Attack",
    serial: 2,
    weight: Weight.Primary,
    triggerInclude() {
      const { map } = data.assets;
      const { actor, place, goal } = data;

      // Determine if an attackable enemy is present
      let enemyInSight = false;
      const area = map.squareOfInfluence(actor);
      
      for (let y = area.y; y < area.y + area.height; y++)
      for (let x = area.x; x < area.x + area.width; x++) {
        if (map.squareAt({x,y}).attackFlag) {
          enemyInSight = true;
        }
      }

      // Other checks
      const targetableInRange = actor.attackReady && enemyInSight;
      const notIndirect = (!actor.isIndirect);
      const hasNotMoved = (goal.equal(place));
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
    weight: Weight.Secondary,
    triggerInclude() {
      const { actor, goalTerrain } = data;

      const readyToCapture = (actor.soldierUnit && goalTerrain.building);
      const notAllied = (actor.faction !== goalTerrain.faction);
      return readyToCapture && notAllied;
    },
    ratify() {
      Command.Move.ratify();

      const { actor, goalTerrain } = data;

      actor.captureBuilding();
      if (actor.buildingCaptured()) {
        actor.stopCapturing();
        goalTerrain.faction = actor.faction;
      }
    },
  }

  /** Unit supplies resources to adjacent allies command. */
  export const Supply: CommandObject = {
    name: "Supply",
    serial: 4,
    weight: Weight.Secondary,
    triggerInclude() {
      const { map } = data.assets;
      const { actor, goal } = data;
      
      return map
        .neighborsAt(goal)
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

  /** Unit combines with allied unit at goal command. */
  export const Join: CommandObject = {
    name: "Join",
    serial: 5,
    weight: Weight.Tertiary,
    triggerInclude() {
      const { map } = data.assets;
      const { actor, goal } = data;

      const other = map.squareAt(goal).unit;
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
      const { actor, goal } = data;

      const other = map.squareAt(goal).unit;
      if (!other)
        throw new RatificationError(`no unit to join with`);
      if (other.faction !== actor.faction)
        throw new RatificationError(`units to join are not allied`);
      if (other.type !== actor.type)
        throw new RatificationError(`units to join are not of same type`);

      function roundUp(n: number) { return Math.ceil(n * .10) * 10; }

      const { hp, gas, ammo } = actor;
      const newHp = roundUp(hp) + roundUp(other.hp);
      const extraHp = Math.max(newHp - UnitObject.MaxHp, 0);
      const returnedFunds = extraHp / UnitObject.MaxHp * actor.cost;
      players.current.funds += returnedFunds;

      other.hp = newHp;
      other.gas += gas;
      other.ammo += ammo;

      actor.destroy();
      other.spent = true;
    },
  }

  /** Unit load into boardable unit action. */
  export const Load: CommandObject = {
    name: "Load",
    serial: 6,
    weight: Weight.Tertiary,
    triggerInclude() {
      const { actor, goalTile } = data;
      return goalTile.unit?.boardable(actor) || false;
    },
    ratify() {
      const { map } = data.assets;
      const { actor, underneath } = data;
      map.removeUnit(actor.boardLocation);
      underneath.loadUnit(actor);
    },
  }

  /** Unit load into boardable unit action. */
  export const Drop: CommandObject = {
    name: "Drop",
    serial: 7,
    weight: Weight.Secondary,
    triggerInclude() {
      const { map } = data.assets;
      const { actor, goal } = data;

      const neighbors = map.neighborsAt(goal);
      const holdingUnit = actor.loadedUnits.length > 0;
      const oneEmptySpace = actor.loadedUnits
        .some( unit => neighbors.orthogonals
          .some( tile => tile.occupiable(unit) )
        );
      return holdingUnit && oneEmptySpace;
    },
    ratify() {
      const { map } = data.assets;
      const { actor, which, focal } = data;

      const unit = actor.unloadUnit(which);
      map.placeUnit(unit, focal);
      unit.spent = true;
    },
  }

  /** Unit spawns at location action. */
  export const SpawnUnit: CommandObject = {
    name: "SpawnUnit",
    serial: 8,
    weight: Weight.None,
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
