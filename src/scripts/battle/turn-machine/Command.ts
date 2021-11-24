import { Point } from "../../Common/Point";
import { Common } from "../../CommonUtils";
import { DamageScript } from "../DamageScript";
import { AttackMethod } from "../EnumTypes";
import { SupplyEvent } from "../map/tile-effects/SupplyEvent";
import { Unit } from "../Unit";
import { UnitObject } from "../UnitObject";
import { instructionData } from "./InstructionData";


const { data } = instructionData;

export class RatificationError extends Error {
  name = 'RatificationError';
}

/** Returns a CommandObject<number> corrosponding to the given serial number. */
export function getCommandObject(serial: number): CommandObject<number> {
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
export type CommandObject<T> = {
  /** Name string; use as menu option title. */
  name: string,
  /** Command identification serial. */
  serial: number,
  /** Values for variant behavior. */
  input: T,
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
  export const Wait: CommandObject<number> = {
    name: "Wait",
    serial: 0,
    input: 0,
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
  export const Move: CommandObject<number> = {
    name: "Move",
    serial: 1,
    input: 0,
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
  export const Attack: CommandObject<number> = {
    name: "Attack",
    serial: 2,
    input: 0,
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
      const { seed, actor, goal, target } = data;
      const toRemove: UnitObject[] = [];

      function damageApply(attacker: UnitObject, defender: UnitObject, damage: number) {
        if (damage === 0)
          return;
        defender.hp -= damage;
        if (attacker.attackMethodFor(defender) === AttackMethod.Primary)
          attacker.ammo -= 1;
        if (map.squareAt(attacker.boardLocation).COAffectedFlag)
          attacker.boardPlayer.increasePowerMeter(damage);
          // TODO This counts *potential* damage, not real. Does this matter?
          // If you destroy a 2HP Rockets, should you get CO power for all 6 you would have done?
        if (defender.hp === 0) {
          attacker.rank += 1;
          // TODO Push destroy event to anim standby events
          toRemove.push(defender);
        }
      }

      const battleResults = DamageScript.NormalAttack(map, actor, goal, target, seed);
      damageApply(actor, target, battleResults.damage);
      damageApply(target, actor, battleResults.counter);

      for (const unit of toRemove)
        unit.destroy();
    }
  }

  /** Unit capture property on board command. */
  export const Capture: CommandObject<number> = {
    name: "Capture",
    serial: 3,
    input: 0,
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
  export const Supply: CommandObject<number> = {
    name: "Supply",
    serial: 4,
    input: 0,
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
          if (square.unit && square.unit.resuppliable(actor)) {
            square.unit.resupply();
            new SupplyEvent({location: square.unit.boardLocation});
          }
        });
    }
  }

  /** Unit combines with allied unit at goal command. */
  export const Join: CommandObject<number> = {
    name: "Join",
    serial: 5,
    input: 0,
    weight: Weight.Tertiary,
    triggerInclude() {
      const { map } = data.assets;
      const { actor, goal } = data;

      const other = map.squareAt(goal).unit;
      if (!other)
        return false;

      return actor.mergeable(other);
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

      const highestRank = Math.max(actor.rank, other.rank);

      other.hp = newHp;
      other.gas += gas;
      other.ammo += ammo;
      other.rank = highestRank;

      actor.destroy();
      other.spent = true;
    },
  }

  /** Unit load into boardable unit action. */
  export const Load: CommandObject<number> = {
    name: "Load",
    serial: 6,
    input: 0,
    weight: Weight.Tertiary,
    triggerInclude() {
      const { actor, goalTile } = data;
      return goalTile.unit?.boardable(actor) || false;
    },
    ratify() {
      const { map, scenario } = data.assets;
      const { actor, place, path, underneath } = data;

      map.removeUnit(actor.boardLocation);
      underneath.loadUnit(actor);
      actor.spent = true;
      
      if (actor.type !== Unit.Rig || !scenario.rigsInfiniteGas)
        actor.gas -= map.travelCostForPath(place, path, actor.moveType);
    },
  }

  /** Unit load into boardable unit action. */
  export const Drop: CommandObject<number> = {
    name: "Drop",
    serial: 7,
    input: -1,
    weight: Weight.Secondary,
    triggerInclude() {
      const { map } = data.assets;
      const { actor, goal, drop } = data;

      if (this.input === -1)  // Null case
        return false;

      if (actor.loadedUnits.length === 0) // Nothing to drop
        return false;

      if (!Common.validIndex(this.input, actor.loadedUnits.length))
        throw new RatificationError(`${this.name} → input ${this.input} does not correspond to a held unit.`);

      const neighbors = map.neighborsAt(goal);
      const unit = actor.loadedUnits[this.input];

      const alreadyDropped = drop
        .map( d => d.which )
        .includes( this.input );
      const oneEmptySpace = neighbors.orthogonals
          .some( tile => (tile.occupiable(unit) || tile.unit === actor)
            && !drop.some( d => d.where.equal(tile.pos) ) );
      return !alreadyDropped && oneEmptySpace;
    },
    ratify() {
      const { drop } = data;

      if (drop.length === 0)
        return;

      const { map } = data.assets;
      const { actor } = data;

      // Unlike trigger, ratify is generic.
      drop
        .sort( (a,b) => b.which - a.which )
        .forEach( ins => {
          const unit = actor.unloadUnit(ins.which);
          map.placeUnit(unit, ins.where);
          unit.spent = true;
        });
    },
  }

  /** Unit spawns at location action. */
  export const SpawnUnit: CommandObject<number> = {
    name: "SpawnUnit",
    serial: 8,
    input: 0,
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
