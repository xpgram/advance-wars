import { CardinalVector, SumCardinalsToVector } from "../../Common/CardinalDirection";
import { SerialGenerator } from "../../Common/SerialGenerator";
import { Include } from "../../CommonTypes";
import { Common } from "../../CommonUtils";
import { Debug } from "../../DebugUtils";
import { DamageScript } from "../DamageScript";
import { Terrain } from "../map/Terrain";
import { TerrainObject } from "../map/TerrainObject";
import { AnnointCoUnitEvent } from "../map/tile-effects/AnnointCoUnitEvent";
import { BattleDamageEvent } from "../map/tile-effects/BattleDamageEvent";
import { BuildTempPortEvent } from "../map/tile-effects/BuildTempPortEvent";
import { CapturePropertyEvent } from "../map/tile-effects/CapturePropertyEvent";
import { DiveEvent } from "../map/tile-effects/DiveEvents";
import { DropHeldUnitEvent } from "../map/tile-effects/DropHeldUnitEvent";
import { FlareIgniteEvent } from "../map/tile-effects/FlareIgniteEvent";
import { FlareLaunchEvent } from "../map/tile-effects/FlareLaunchEvent";
import { GenericRatifyEvent } from "../map/tile-effects/GenericRatifyEvent";
import { JoinUnitEvent } from "../map/tile-effects/JoinUnitEvent";
import { LoadUnitEvent } from "../map/tile-effects/LoadUnitEvent";
import { MoveUnitEvent } from "../map/tile-effects/MoveUnitEvent";
import { RevealNeighborsEvent } from "../map/tile-effects/RevealNeighborsEvent";
import { SiloImpactEvent } from "../map/tile-effects/SiloImpactEvent";
import { SiloLaunchEvent } from "../map/tile-effects/SiloLaunchEvent";
import { SpeechBubbleEvent } from "../map/tile-effects/SpeechBubbleEvent";
import { TileEvent } from "../map/tile-effects/TileEvent";
import { TrackCar } from "../TrackCar";
import { ViewSide } from "../ui-windows/generic-components/UiEnums";
import { Unit } from "../Unit";
import { CommonRangesRetriever, RegionMap } from "../unit-actions/RegionMap";
import { UnitObject } from "../UnitObject";
import { CommandHelpers } from "./Command.helpers";
import { instructionData } from "./InstructionData";
import { ChooseAttackTarget } from "./states/ChooseAttackTarget";
import { ChooseMapTarget } from "./states/ChooseMapTarget";
import { CommandMenu } from "./states/CommandMenu";
import { DropLocation } from "./states/DropLocation";


const { data } = instructionData;

// TODO Move these feckign types out of the module; they're inaccessible.
const { ExitCode, Weight, RatificationError } = CommandHelpers;
type ExitCode = CommandHelpers.ExitCode;
type Weight = CommandHelpers.Weight;
type CommandObject = CommandHelpers.CommandObject;
type UniqueStats = CommandHelpers.UniqueStats;

const Serial = SerialGenerator();

/** Default command object properties. */
const cmdDefaults = {
  ingressSteps: [],
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
    get chain() { return [Move, Wait, Drop]; },
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
      const { action, place, path, actor, assets } = data;

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

      const ambushed = (realPath.length !== path.length);
      const realGoal = SumCardinalsToVector(realPath).add(place);

      // TODO Attack needs some way of passing this in.
      // get chain() recently ruined any chance of that, though...
      // Maybe the problem is actually with MoveEvent's handling of camera focus.
      //
      // And also! It needs to actually work.
      // I probably disabled it on purpose.
      // I think camera needs a two-focal mode and a 'pull-away' follow-alg
      // that picks target frames that include both if possible but prefers
      // the second when it isn't.
      // The benefit of a proper pull-away style is that the focus the would
      // follow a moving target via the further edge. A TrackCar moving east
      // toward a target would be camera bound to the camera's left side as
      // they both moved toward the real point of focus.
      const target = (action === Attack.serial) ? instruction.focal : undefined;

      // Schedule events
      if (place.notEqual(realGoal)) {
        boardEvents.schedule(
          new MoveUnitEvent({actor, path: realPath, goal: realGoal, target, assets}),
          (ambushed) && new SpeechBubbleEvent({actor, camera, message: "ambush"}),
          new RevealNeighborsEvent({location: realGoal, assets}),
        );
      }

      return (ambushed) ? ExitCode.Interrupted : ExitCode.Success;
    },
  }

  /** Unit attack target from location command. */
  export const Attack: CommandObject = {
    ...cmdDefaults,

    get type() { return Attack; },
    get chain() { return [Move, Attack]; },
    get ingressSteps() { return [ChooseAttackTarget]; },
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
      const { seed, actor, goal, focalTile, assets } = data;
      const events = [];

      const target = focalTile.unit ?? focalTile.terrain;

      function getDamageEvent(attacker: UnitObject, defender: UnitObject | TerrainObject, damage: number, trackCar?: TrackCar) {
        return (defender instanceof UnitObject)
          ? new BattleDamageEvent({attacker, defender, damage, trackCar, assets})
          : new GenericRatifyEvent({location: goal, ratify: () => {
              defender.value -= damage;
            }});
      }

      const battleResults = (target instanceof UnitObject)
        ? DamageScript.NormalAttack(map, actor, goal, target, seed)
        : DamageScript.TerrainAttack(map, actor, goal, target, seed);
      events.push(getDamageEvent(actor, target, battleResults.damage));
      if (target instanceof UnitObject && target.canCounterAttack(actor, goal))
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
      const { actor, goalTerrain: terrain, assets } = data;
      boardEvents.schedule(new CapturePropertyEvent({actor, terrain, assets}));
      return ExitCode.Success;
    },
  }

  /** Rig unit builds a temp port/airport. */
  export const Build: CommandObject = {
    ...cmdDefaults,

    get type() { return Build; },
    get chain() { return [Move, Build]; },
    name: "Build",
    serial: Serial.next().value,
    weight: Weight.Primary,

    triggerInclude() {
      const { map } = data.assets;
      const { actor, goal } = data;

      const terrType = map.squareAt(goal).terrain.type;

      const rigUnit = (actor.type === Unit.Rig);
      const enoughAmmo = (actor.ammo > 0);
      const buildableTerrain = (terrType === Terrain.Plain || terrType === Terrain.Beach);
      return (rigUnit && enoughAmmo && buildableTerrain);
    },

    scheduleEvent() {
      const { boardEvents } = data.assets;
      const { actor, goalTerrain: terrain, assets } = data;
      boardEvents.schedule(new BuildTempPortEvent({actor, terrain, assets}));
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
      const { actor, place, assets } = data;

      boardEvents.schedule(new DiveEvent({
        unit: actor,
        location: place,
        anim: 'dive',
        assets,
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
      const { actor, goal, assets } = data;

      boardEvents.schedule(new DiveEvent({
        unit: actor,
        location: goal,
        anim: 'surface',
        assets,
      }));

      return ExitCode.Success;
    }
  }

  /** Unit launches a flare, illuminating hidden areas on the map. */
  export const Flare: CommandObject & Include<UniqueStats, 'effectAreaMap' | 'range'> = {
    ...cmdDefaults,

    get type() { return Flare; },
    get chain() { return [Move, Flare]; },
    get ingressSteps() { return [ChooseMapTarget]; },
    name: "Flare",
    serial: Serial.next().value,
    weight: Weight.Secondary,

    effectAreaMap: CommonRangesRetriever({min:0,max:2}),
    range: {min:0,max:5},

    triggerInclude() {
      const { actor, plansToMove } = data;
      const flareUnit = actor.type === Unit.Flare;
      const spendableAmmo = actor.ammo > 0;
      return (!plansToMove && flareUnit && spendableAmmo);
    },

    scheduleEvent() {
      const { boardEvents } = data.assets;
      const { actor, goal, focal, assets } = data;

      boardEvents.schedule(
        new FlareLaunchEvent({
          location: goal,
          side: (actor.reverseFacing) ? ViewSide.Left : ViewSide.Right,
        }),
        new FlareIgniteEvent({
          actor,
          location: focal,
          assets,
        }),
      )

      return ExitCode.Success;
    },
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
    get ingressSteps() { return [DropLocation, CommandMenu]; },
    name: "Drop",
    serial: Serial.next().value,
    weight: Weight.Secondary,
    index: -1,
    
    triggerInclude() {
      const { map } = data.assets;
      const { actor, goal, drop } = data;

      if (this.index === -1)  // Null case
        return false;

      if (actor.cargo.length === 0) // Nothing to drop
        return false;

      if (!Common.validIndex(this.index, actor.cargo.length))
        throw new RatificationError(`${this.name} → input ${this.index} does not correspond to a held unit.`);

      const neighbors = map.neighborsAt(goal);
      const unit = actor.cargo[this.index];

      const alreadyDropped = drop
        .map( d => d.which )
        .includes( this.index );
      const oneEmptySpace = neighbors.orthogonals
        .some( tile => (tile.occupiable(unit) || (tile.traversable(unit) && tile.unit === actor) )
          && !drop.some( d => d.where.equal(tile.boardLocation) ) );
      return !alreadyDropped && oneEmptySpace;
    },
    
    scheduleEvent() {
      const { drop } = data;

      if (drop.length === 0)
        return ExitCode.Success;

      const { boardEvents, map, camera } = data.assets;
      const { actor, assets } = data;
      const { insertIf } = Common;

      // Dropped units must have an empty space to enter, otherwise unsuccessful.
      const emptyCheck = (u: UnitObject | undefined) => !u || u === actor;
      const toDrop = drop.filter( d => emptyCheck(map.squareAt(d.where).unit) );
      
      boardEvents.schedule([
        new DropHeldUnitEvent({actor, drop: toDrop, assets}),

        ...insertIf( (toDrop.length !== drop.length),
          new SpeechBubbleEvent({actor, camera, message: 'ambush'})),
      ]);
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
      const { boardEvents } = data.assets;
      const { actor, goal, assets } = data;

      boardEvents.schedule(new AnnointCoUnitEvent({
        actor,
        location: goal,
        assets,
      }));

      return ExitCode.Success;
    },
  }

  export const LaunchSilo: CommandObject & Include<UniqueStats, 'effectAreaMap' | 'damage'> = {
    ...cmdDefaults,

    get type() { return LaunchSilo; },
    get chain() { return [Move, LaunchSilo]; },
    get ingressSteps() { return [ChooseMapTarget]; },
    name: "Missile",
    serial: Serial.next().value,
    weight: Weight.Tertiary,

    effectAreaMap: CommonRangesRetriever({min:0,max:2}),
    damage: 30,

    triggerInclude() {
      const { actor, goalTerrain } = data;
      const silo = (goalTerrain.type === Terrain.Silo);
      const actionable = (goalTerrain.actionable(actor));
      return (silo && actionable);
    },

    scheduleEvent() {
      const { boardEvents } = data.assets;
      const { goal, goalTerrain, focal, assets } = data;

      if (!(goalTerrain instanceof Terrain.Silo)) {
        throw new RatificationError(`goal terrain is not Silo: pos ${goal.toString()} '${goalTerrain.name}'`);
      }

      boardEvents.schedule(
        new SiloLaunchEvent({
          location: goal,
          terrain: goalTerrain,
        }),
        new SiloImpactEvent({
          location: focal,
          assets,
        }),
      );

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
      const { map, players } = data.assets;
      const { which, place } = data;

      const unit = players.current.spawnUnit({
        location: place,
        serial: which,
        spent: true,
      });
      players.current.expendFunds(unit.cost);

      map.revealSightMapLocation(place, players.perspective, unit);

      return ExitCode.Success;
    },
  }

}
