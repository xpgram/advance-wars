import { Common } from "../../CommonUtils";
import { DamageScript } from "../DamageScript";
import { AttackMethod } from "../EnumTypes";
import { BattleDamageEvent } from "../map/tile-effects/BattleDamageEvent";
import { CapturePropertyEvent } from "../map/tile-effects/CapturePropertyEvent";
import { DestructEvent } from "../map/tile-effects/DestructEvent";
import { DropHeldUnitEvent } from "../map/tile-effects/DropHeldUnitEvent";
import { JoinUnitEvent } from "../map/tile-effects/JoinUnitEvent";
import { LoadUnitEvent } from "../map/tile-effects/LoadUnitEvent";
import { MoveUnitEvent } from "../map/tile-effects/MoveUnitEvent";
import { SpeechBubbleEvent } from "../map/tile-effects/SpeechBubbleEvent";
import { TrackCar } from "../TrackCar";
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
      const { boardEvents, instruction } = data.assets;
      const { place, path, goal, actor, assets } = data;

      // TODO Scan path tiles for ambush interruptions

      // TODO It would be nice if Command.Attack could specify this itself.
      const target = (instruction.action === Command.Attack.serial)
        ? instruction.focal
        : undefined;

      if (place.notEqual(goal))
        boardEvents.add(new MoveUnitEvent({actor, path, target, assets}));
    },
  }

  /** Unit attack target from location command. */
  export const Attack: CommandObject<number> = {
    name: "Fire",
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
      const canMove = (actor.canMoveAndAttack);
      const hasNotMoved = (goal.equal(place));
      return targetableInRange && (canMove || hasNotMoved);
    },
    ratify() {
      Command.Move.ratify();

      const { map, trackCar, boardEvents } = data.assets;
      const { seed, actor, goal, target, assets } = data;
      const events = [];

      function getDamageEvent(attacker: UnitObject, defender: UnitObject, damage: number, trackCar?: TrackCar) {
        return new BattleDamageEvent({attacker, defender, damage, trackCar, assets});
      }

      const battleResults = DamageScript.NormalAttack(map, actor, goal, target, seed);
      events.push(getDamageEvent(actor, target, battleResults.damage));
      events.push(getDamageEvent(target, actor, battleResults.counter, trackCar));
      boardEvents.add(...events);
      // TODO boardEvents.add(events); // When there is concurrency
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

      const { boardEvents } = data.assets;
      const { actor, goalTerrain: terrain } = data;

      boardEvents.add(new CapturePropertyEvent({actor, terrain}));
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

      const { map, camera, boardEvents } = data.assets;
      const { actor } = data;

      map.neighborsAt(actor.boardLocation)
        .orthogonals
        .forEach( square => {
          if (square.unit && square.unit.resuppliable(actor)) {
            square.unit.resupply();   // TODO Happens in scheduled event
            const event = new SpeechBubbleEvent({
              message: 'supply',
              location: square.unit.boardLocation,
              camera
            });
            boardEvents.add(event);
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
      const { map, boardEvents } = data.assets;
      const { actor, path, goal, assets } = data;

      const other = map.squareAt(goal).unit;
      if (!other)
        throw new RatificationError(`no unit to join with`);
      if (other.faction !== actor.faction)
        throw new RatificationError(`units to join are not allied`);
      if (other.type !== actor.type)
        throw new RatificationError(`units to join are not of same type`);

      boardEvents.add(new JoinUnitEvent({actor, path, other, assets}));
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
      const { boardEvents } = data.assets;
      const { actor, path, underneath, assets } = data;

      boardEvents.add(new LoadUnitEvent({actor, path, underneath, assets}));
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

      const { boardEvents } = data.assets;
      const { actor, assets } = data;

      boardEvents.add( new DropHeldUnitEvent({actor, drop, assets}));
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
