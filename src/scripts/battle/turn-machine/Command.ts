import { CardinalVector, SumCardinalsToVector } from "../../Common/CardinalDirection";
import { Point } from "../../Common/Point";
import { Common } from "../../CommonUtils";
import { DamageScript } from "../DamageScript";
import { BattleDamageEvent } from "../map/tile-effects/BattleDamageEvent";
import { CapturePropertyEvent } from "../map/tile-effects/CapturePropertyEvent";
import { DropHeldUnitEvent } from "../map/tile-effects/DropHeldUnitEvent";
import { GenericRatifyEvent } from "../map/tile-effects/GenericRatifyEvent";
import { JoinUnitEvent } from "../map/tile-effects/JoinUnitEvent";
import { LoadUnitEvent } from "../map/tile-effects/LoadUnitEvent";
import { MoveUnitEvent } from "../map/tile-effects/MoveUnitEvent";
import { SpeechBubbleEvent } from "../map/tile-effects/SpeechBubbleEvent";
import { TrackCar } from "../TrackCar";
import { Unit } from "../Unit";
import { UnitObject } from "../UnitObject";
import { CommandHelpers } from "./Command.helpers";
import { instructionData } from "./InstructionData";


const { data } = instructionData;

const { ExitCode, Weight, Serial, RatificationError } = CommandHelpers;
type ExitCode = CommandHelpers.ExitCode;
type Weight = CommandHelpers.Weight;
type CommandObject = CommandHelpers.CommandObject;

/** Default command object properties. */
const cmdDefaults = {
  spendsUnit: true,
  triggerInclude() { return false; },
  scheduleEvent() { return ExitCode.Success; },
}

/** Global container for Command objects and logic. */
export module Command {

  /** Unit idle at location command. */
  export const Wait: CommandObject = {
    ...cmdDefaults,

    get type() { return Wait; },
    get chain() { return [Move, Wait]; },
    name: "Wait",
    serial: Serial.next().value,
    weight: Weight.Quaternary,

    triggerInclude() {
      const { actor, goalTile } = data;
      return goalTile.occupiable(actor);
    },
  }

  /** Moves a unit from one board location to another. */
  export const Move: CommandObject = {
    ...cmdDefaults,

    get type() { return Move; },
    get chain() { return [Move]; },
    name: "Move",
    serial: Serial.next().value,
    weight: Weight.None,

    triggerInclude() {
      return false;
    },
    
    scheduleEvent() {
      const { map, boardEvents, camera, instruction } = data.assets;
      const { place, path, actor, assets } = data;

      // This has to be here because any formal turn will unset this property anyway,
      // and the status icon should be unset immediately to prevent flickering.
      actor.CoCouldBoard = false;

      // Scan path tiles for ambush interruptions and shorten the path
      // to accomodate. + Schedule an ambush bubble.
      const realPath = [] as typeof path;
      let cursor = actor.boardLocation;
      for (const p of path) {
        const next = cursor.add(CardinalVector(p));
        const tile = map.squareAt(next);

        // TODO tile.traversable or something, but it has to be irrespective of tile.hidden
        if (tile.unit && tile.unit.faction !== actor.faction)
          break;

        realPath.push(p);
        cursor = next;
      }

      console.log(realPath, 'from', path);

      const ambushed = (realPath.length !== path.length);
      const target = instruction.focal;
      const realGoal = SumCardinalsToVector(realPath).add(place);

      // Schedule events
      if (place.notEqual(realGoal))
        boardEvents.schedule(new MoveUnitEvent({actor, path: realPath, goal: realGoal, target, assets}));
      if (ambushed)
        boardEvents.schedule(new SpeechBubbleEvent({actor, camera, message: "ambush"}));

      return (ambushed) ? ExitCode.Interrupted : ExitCode.Success;
    },
  }

  /** Unit attack target from location command. */
  export const Attack: CommandObject = {
    ...cmdDefaults,

    get type() { return Attack; },
    get chain() { return [Move, Attack]; },
    name: "Fire",
    serial: Serial.next().value,
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

    scheduleEvent() {
      const { map, trackCar, boardEvents } = data.assets;
      const { seed, actor, goal, target, assets } = data;
      const events = [];

      function getDamageEvent(attacker: UnitObject, defender: UnitObject, damage: number, trackCar?: TrackCar) {
        return new BattleDamageEvent({attacker, defender, damage, trackCar, assets});
      }

      const battleResults = DamageScript.NormalAttack(map, actor, goal, target, seed);
      events.push(getDamageEvent(actor, target, battleResults.damage));
      if (target.canCounterAttack(actor, goal))
        events.push(getDamageEvent(target, actor, battleResults.counter, trackCar));
      boardEvents.schedule(events);

      return ExitCode.Success;
    }
  }

  /** Unit capture property on board command. */
  export const Capture: CommandObject = {
    ...cmdDefaults,

    get type() { return Capture; },
    get chain() { return [Move, Capture]; },
    name: "Capture",
    serial: Serial.next().value,
    weight: Weight.Secondary,
    
    triggerInclude() {
      const { actor, goalTerrain } = data;

      const readyToCapture = (actor.soldierUnit && goalTerrain.building);
      const notAllied = (actor.faction !== goalTerrain.faction);
      return readyToCapture && notAllied;
    },

    scheduleEvent() {
      const { boardEvents } = data.assets;
      const { actor, goalTerrain: terrain } = data;
      boardEvents.schedule(new CapturePropertyEvent({actor, terrain}));
      return ExitCode.Success;
    },
  }

  /** Unit supplies resources to adjacent allies command. */
  export const Supply: CommandObject = {
    ...cmdDefaults,

    get type() { return Supply; },
    get chain() { return [Move, Supply]; },
    name: "Supply",
    serial: Serial.next().value,
    weight: Weight.Secondary,
    
    triggerInclude() {
      const { map } = data.assets;
      const { actor, goal } = data;
      
      return map
        .neighborsAt(goal)
        .orthogonals
        .some( square => square.unit && square.unit.resuppliable(actor) );
    },

    scheduleEvent() {
      const { map, camera, boardEvents } = data.assets;
      const { actor, goal } = data;
      const events: SpeechBubbleEvent[] = [];

      map.neighborsAt(goal)
        .orthogonals
        .forEach( square => {
          if (square.unit && square.unit.resuppliable(actor)) {
            const event = new SpeechBubbleEvent({
              message: 'supply',
              actor: square.unit,
              camera
            });
            events.push(event);
          }
        });
      boardEvents.schedule(events);

      return ExitCode.Success;
    }
  }

  /** Unit sinks into water, hiding itself from other players. */
  export const Dive: CommandObject = {
    ...cmdDefaults,

    get type() { return Dive; },
    get chain() { return [Dive, Move]; },
    name: "Dive",
    serial: Serial.next().value,
    weight: Weight.Unpreferred,

    triggerInclude() {
      const { actor } = data;
      return !actor.hiding && actor.type === Unit.Submarine;
    },

    scheduleEvent() {
      const { boardEvents } = data.assets;
      const { actor, place } = data;

      boardEvents.schedule(new GenericRatifyEvent({
        location: place,
        time: .2,
        ratify: () => {
          actor.hiding = true;
          // TODO Update actor vis; this will probs duplicate some code in TurnStart, so I need to extract.
          // Square has access to map — at least I think it does — so it can evaluate whether to actually show the
          // unit or not. I mean, it does that anyway.
        }
      }));

      return ExitCode.Success;
    }
  }

  /** Unit sinks into water, hiding itself from other players. */
  export const Surface: CommandObject = {
    ...cmdDefaults,

    get type() { return Surface; },
    get chain() { return [Move, Surface]; },
    name: "Surface",
    serial: Serial.next().value,
    weight: Weight.Unpreferred,
    
    triggerInclude() {
      const { actor } = data;
      return actor.hiding && actor.type === Unit.Submarine;
    },
    
    scheduleEvent() {
      const { boardEvents } = data.assets;
      const { actor, goal } = data;
      boardEvents.schedule(new GenericRatifyEvent({
        location: goal,
        ratify: () => {
          actor.hiding = false;
          // TODO Update actor vis; this will probs duplicate some code in TurnStart, so I need to extract.
          // Square has access to map — at least I think it does — so it can evaluate whether to actually show the
          // unit or not. I mean, it does that anyway.
        }
      }));
      return ExitCode.Success;
    }
  }

  /** Unit combines with allied unit at goal command. */
  export const Join: CommandObject = {
    ...cmdDefaults,
    
    get type() { return Join; },
    get chain() { return [Join]; },
    name: "Join",
    serial: Serial.next().value,
    weight: Weight.Tertiary,
    
    triggerInclude() {
      const { map } = data.assets;
      const { actor, goal } = data;

      const other = map.squareAt(goal).unit;
      if (!other)
        return false;

      return actor.mergeable(other);
    },
    
    scheduleEvent() {
      const { map, boardEvents } = data.assets;
      const { actor, path, goal, assets } = data;

      const other = map.squareAt(goal).unit;
      if (!other)
        throw new RatificationError(`no unit to join with`);
      if (other.faction !== actor.faction)
        throw new RatificationError(`units to join are not allied`);
      if (other.type !== actor.type)
        throw new RatificationError(`units to join are not of same type`);

      boardEvents.schedule(new JoinUnitEvent({actor, path, goal, other, assets}));
      return ExitCode.Success;
    },
  }

  /** Unit load into boardable unit action. */
  export const Load: CommandObject = {
    ...cmdDefaults,
    
    get type() { return Load; },
    get chain() { return [Load]; },
    name: "Load",
    serial: Serial.next().value,
    weight: Weight.Tertiary,
    
    triggerInclude() {
      const { actor, goalTile } = data;
      return goalTile.unit?.boardable(actor) || false;
    },
    
    scheduleEvent() {
      const { boardEvents } = data.assets;
      const { actor, path, goal, underneath, assets } = data;

      boardEvents.schedule(new LoadUnitEvent({actor, path, goal, underneath, assets}));
      return ExitCode.Success;
    },
  }

  type DropCommand = CommandObject & {index: number};
  /** Unit load into boardable unit action. */
  export const Drop: DropCommand = {
    ...cmdDefaults,
    
    get type() { return Drop; },
    get chain() { return [Move, Drop]; },
    name: "Drop",
    serial: Serial.next().value,
    weight: Weight.Secondary,
    index: -1,
    
    triggerInclude() {
      const { map } = data.assets;
      const { actor, goal, drop } = data;

      if (this.index === -1)  // Null case
        return false;

      if (actor.loadedUnits.length === 0) // Nothing to drop
        return false;

      if (!Common.validIndex(this.index, actor.loadedUnits.length))
        throw new RatificationError(`${this.name} → input ${this.index} does not correspond to a held unit.`);

      const neighbors = map.neighborsAt(goal);
      const unit = actor.loadedUnits[this.index];

      const alreadyDropped = drop
        .map( d => d.which )
        .includes( this.index );
      const oneEmptySpace = neighbors.orthogonals
        .some( tile => (tile.occupiable(unit) || tile.unit === actor)
          && !drop.some( d => d.where.equal(tile.pos) ) );
      return !alreadyDropped && oneEmptySpace;
    },
    
    scheduleEvent() {
      const { drop } = data;

      if (drop.length === 0)
        return ExitCode.Success;

      const { boardEvents } = data.assets;
      const { actor, assets } = data;

      boardEvents.schedule( new DropHeldUnitEvent({actor, drop, assets}));
      return ExitCode.Success;
    },
  }

  /** Unit becomes special 'CO' unit. */
  export const LoadCO: CommandObject = {
    ...cmdDefaults,
    
    get type() { return LoadCO; },
    get chain() { return [LoadCO]; },
    name: "CO",
    serial: Serial.next().value,
    weight: Weight.Unpreferred,
    spendsUnit: false,
    
    triggerInclude() {
      const { actor, plansToMove } = data;
      return (actor.CoCouldBoard && !plansToMove);
    },
    
    scheduleEvent() {
      const { boardEvents, players } = data.assets;
      const { actor } = data;

      boardEvents.schedule(new GenericRatifyEvent({
        location: actor.boardLocation,
        ratify: () => {
          actor.CoOnBoard = true;
          actor.rank = 3;
          players.perspectivesTurn?.setCoBoardableIndicators();
          players.current.expendFunds(actor.cost);
        }
      }));

      return ExitCode.Success;
    },
  }

  /** Unit spawns at location action. */
  export const SpawnUnit: CommandObject = {
    ...cmdDefaults,
    
    get type() { return SpawnUnit; },
    get chain() { return [SpawnUnit]; },
    name: "SpawnUnit",
    serial: Serial.next().value,
    weight: Weight.None,
    
    triggerInclude() {
      return false;
    },
    
    scheduleEvent() {
      const { players } = data.assets;
      const { which, place } = data;

      const unit = players.current.spawnUnit({
        location: place,
        serial: which,
        spent: true,
      });
      players.current.expendFunds(unit.cost);

      return ExitCode.Success;
    },
  }

}
