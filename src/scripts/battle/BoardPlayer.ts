import { UnitObject } from "./UnitObject";
import { Slider } from "../Common/Slider";
import { Map } from "./map/Map";
import { ImmutablePointPrimitive, Point } from "../Common/Point";
import { CommandingOfficer } from "./CommandingOfficer";
import { Faction, FactionColors } from "./EnumTypes";
import { Terrain } from "./map/Terrain";
import { CommandingOfficerObject } from "./CommandingOfficerObject";

/**  */
export type UnitSpawnSettings = {
  location: ImmutablePointPrimitive,
  serial: number,
  hp?: number,
  ammo?: number,
  gas?: number,
  capture?: number,
  spent?: boolean,  // For multiplayer disconnect and reconnect
    // TODO Any other mid-turn settings?
}

/** There was a problem building a new BoardPlayer. */
export class BoardPlayerConstructionError extends Error {
  name = "BoardPlayerConstructionError";
}

/** There was a problem spawning a new unit. */
export class SpawnUnitError extends Error {
  name = "SpawnUnitError";
}

// TODO These should be in some MatchSettings object configurable before the match starts.
/** How many funds each city earns you at the start of each turn. */
const FUNDS_PER_CITY = 1000;
/** The maximum number of deployed units this player may own at once. */
const MAX_UNITS = 50;

type BoardPlayerOptions = {
  /** Which controller slot this player belongs to. */
  playerNumber: number,
  /** The team color. */
  faction: Faction,
  /** The serial number for the commanding officer being played as. */
  officerSerial: number,
  /** Reference to the board being played on. */
  map: Map,

  /** Board location of all player-owned properties. Must include at least one HQ.
   * All points listed must be neutral, cannot be owned by other players. */
  capturePoints: Point[],

  /** Board location and status information for all pre-deploy units. */
  unitSpawns?: UnitSpawnSettings[];

  /** Max is 128. Default 0. */
  powerMeter?: number,

  /** Default is 0. */
  funds?: number,
};

/** The player-data object for a participant in a game. */
export class BoardPlayer {
  map: Map;
  playerNumber: number;             // Which real player (slot) this player-object belongs to.
  faction: Faction;                 // The army-color owned by this player, more or less.
  officer: CommandingOfficerObject; // Reference to CO class, like Unit.??? or Terrain.???
  capturePoints: Point[] = [];      // Where this player's properties are located.
  powerMeter: Slider;               // How much power meter is charged.
  funds: number;                    // Funds available for spending.
  armyDeployed: boolean;            // Whether this player has had an army yet. Prevents match loss before unit purchase.
  units: UnitObject[] = [];         // List of units under control.

  constructor(options: BoardPlayerOptions) {
    this.map = options.map;
    this.playerNumber = options.playerNumber;
    this.faction = options.faction;
    this.powerMeter = new Slider({max: 128}); // TODO COWindow uses 0-12, so convert or refactor.
    this.funds = options.funds || 0;

    // Validate player number.
    if (false) // TODO stub
      throw new BoardPlayerConstructionError(`Cannot set player number to ${this.playerNumber}: invalid link number.`);

    // Validate faction setting.
    const validFactions = [Faction.Red, Faction.Blue, Faction.Yellow, Faction.Black];
    if (!validFactions.includes(this.faction))
      throw new BoardPlayerConstructionError(`Cannot set player-object faction to ${this.faction}: not a Faction color.`);

    // Validate and set commanding officer object.
    const COType = Object.values(CommandingOfficer).find( CO => CO.serial === options.officerSerial );
    if (!COType)
      throw new BoardPlayerConstructionError(`Cannot set commanding officer: CO serial ${options.officerSerial} not found.`);
    this.officer = new COType();

    // Validate and set ownership of property locations.
    options.capturePoints.forEach( point => {
      const terrain = this.map.squareAt(point).terrain;
      if (terrain.faction !== Faction.None)
        throw new BoardPlayerConstructionError(`Cannot set ownership of property already owned.\n${FactionColors[this.faction]} taking ownership of ${point.toString()} ${terrain.name} Tile owned by ${FactionColors[terrain.faction]}`);
      terrain.faction = this.faction;
    });

    // Validate and spawn units.
    if (options.unitSpawns)
      options.unitSpawns.forEach( settings => this.spawnUnit(settings) );
    this.armyDeployed = (this.units.length > 0);
  }

  /** Unbind references which may be circular. */
  destroy() {
    //@ts-ignore
    this.map = undefined;
    //@ts-ignore
    this.units = undefined;
  }

  /** Returns a list of map Squares corresponding to this player's HQ locations. */
  private get HQs() {
    return this.capturePoints
      .map( p => this.map.squareAt(p) )
      .filter( s => s.terrain.type === Terrain.HQ );
  }

  /** The number of properties captured by this player. */
  get propertyCount(): number {
    return this.capturePoints.length;
  }

  /** The number of properties which generate income captured by this player. */
  get fungiblePropertyCount(): number {
    return this.capturePoints.filter( p => this.map.squareAt(p).terrain.generatesIncome ).length;
  }

  /** The number of deployed units owned by this player. */
  get deployCount(): number {
    return this.units.length;
  }

  /** Returns true if this player has lost this game. */
  get defeated() {
    const headquartersLost = (this.HQs.length === 0);
    const armyDefeated = (this.armyDeployed && this.deployCount === 0);
    return headquartersLost || armyDefeated;
  }

  /** Sets all owned units to orderable. */
  activateAllUnits() {
    this.units.forEach((unit) => {
      unit.orderable = true;
    });
  }

  /** Sets all owned units to unorderable. */
  // TODO orderable=false and deactivated (not my turn) are different qualities.
  deactivateAllUnits() {
    this.units.forEach((unit) => {
      unit.orderable = false;
    });
  }

  /** Spawns a unit according to the given settings. */
  spawnUnit(settings: UnitSpawnSettings) {
    const { location, serial } = settings;

    const square = this.map.squareAt(location);
    const unitType = Object.values(Unit).find( u => u.serial === serial );

    if (!unitType)
      throw new SpawnUnitError(`Could not spawn predeploy: Unit serial ${serial} not found.`);

    const unit = new unitType();
    unit.init({
      faction: this.faction,
      boardPlayer: this,     // TODO Unimplemented in UnitObject
    });

    if (!square.unit == null)
      throw new SpawnUnitError(`Could not spawn predeploy: location ${location.toString()} already occupied.`);
    if (!square.occupiable(unit))
      throw new SpawnUnitError(`Could not spawn predeploy: location ${location.toString()} not occupiable.`);

    this.map.placeUnit(unit, location);
    this.units.push(unit);

    // Other spawn settings.
    // unit.hp = settings.hp || unit.hp;
    // TODO This
  }

  /** Performs clerical work after a unit has been 'killed'. */
  unspawnUnit(unit: UnitObject) {
    this.units = this.units.filter( u => u !== unit );
    this.map.removeUnit(unit.boardLocation);
    unit.destroy();
  }

  /** Updates this BoardPlayer's list of captured properties by scanning
   * the map for properties with a matching faction. */
  scanCapturedProperties() {
    this.capturePoints = [];
    for (let x = 0; x < this.map.width; x++)
    for (let y = 0; y < this.map.height; y++) {
      if (this.map.squareAt({x,y}).terrain.faction === this.faction)
        this.capturePoints.push(new Point(x,y));
    }
  }

  /** Raises this player's available funds by an amount multiplied by the
   * number of owned cities. */
  collectFunds() {
    this.funds += this.fungiblePropertyCount * FUNDS_PER_CITY;
  }

  /** Returns true if this player can afford the given cost. */
  canAfford(cost: number) {
    return (this.funds >= cost);
  }

  /** Subtracts funds from this player's bank. */
  expendFunds(amt: number) {
    this.funds -= amt;
    this.funds = Math.max(this.funds, 0);
  }

  /**  */
  increasePowerMeter(amt: number) {
    // TODO Formula?
  }
}