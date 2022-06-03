import { UnitObject } from "./UnitObject";
import { Slider } from "../Common/Slider";
import { Map } from "./map/Map";
import { ImmutablePointPrimitive, Point } from "../Common/Point";
import { CommandingOfficer } from "./CommandingOfficer";
import { Facing, Faction, FactionColors, UnitClass } from "./EnumTypes";
import { Terrain } from "./map/Terrain";
import { CommandingOfficerObject } from "./CommandingOfficerObject";
import { Unit } from "./Unit";
import { Scenario } from "./turn-machine/BattleSceneControllers";
import { CommonRangesRetriever } from "./unit-actions/RegionMap";
import { Debug } from "../DebugUtils";
import { Common } from "../CommonUtils";

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
  /** Reference to the game's scenario rules. */
  scenario: Scenario,

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
  readonly map: Map;
  readonly scenario: Scenario;
  readonly playerNumber: number;    // Which real player (slot) this player-object belongs to.
  readonly faction: Faction;        // The army-color owned by this player, more or less.
  readonly neverHQ: boolean;        // Whether this player didn't have an HQ during the spawning/map-construction phase; allows players to begin games with no HQ whatsoever.
  readonly armyFacing: Facing;      // Which direction (left/right) the player's army is oriented.
  readonly officer: CommandingOfficerObject; // Reference to CO class, like Unit.??? or Terrain.???

  capturePoints: Point[] = [];      // Where this player's properties are located.
  powerMeter: Slider;               // How much power meter is charged.
  funds: number;                    // Funds available for spending.
  armyDeployed: boolean;            // Whether this player has had an army yet. Prevents match loss before unit purchase.
  units: UnitObject[] = [];         // List of units under control.
  lastCursorPosition: Point;

  /** The number of turns a player must wait to spawn another CO unit. */
  get CoUnitTurnDelay() { return this._CoUnitTurnDelay; }
  set CoUnitTurnDelay(n) {
    this._CoUnitTurnDelay = (n > 0) ? n : 0;
  }
  private _CoUnitTurnDelay: number = 0;


  constructor(options: BoardPlayerOptions) {
    this.map = options.map;
    this.scenario = options.scenario;
    this.playerNumber = options.playerNumber;
    this.faction = options.faction;
    this.powerMeter = new Slider({max: 50*12, granularity: 1}); // 1 of 12 segments every 50 HP.
    this.funds = options.funds || 0;

    // Validate player number.
    if (!Common.within(this.playerNumber, 0, 3))
      throw new BoardPlayerConstructionError(`Cannot set player number to ${this.playerNumber}: must be in range [0,3].`);

    this.armyFacing = (this.playerNumber % 2 === 0) ? Facing.Right : Facing.Left;

    // Validate faction setting.
    const validFactions = [Faction.Red, Faction.Blue, Faction.Yellow, Faction.Black];
    if (!validFactions.includes(this.faction))
      throw new BoardPlayerConstructionError(`Cannot set player-object faction to ${this.faction}: not a Faction color.`);

    // Validate and set commanding officer object.
    const COType = Object.values(CommandingOfficer).find( CO => CO.serial === options.officerSerial );
    if (!COType)
      throw new BoardPlayerConstructionError(`Cannot set commanding officer: CO serial ${options.officerSerial} not found.`);
    this.officer = new COType().init();

    // Validate and set ownership of property locations.
    options.capturePoints.forEach( point => {
      const terrain = this.map.squareAt(point).terrain;
      if (terrain.faction !== Faction.None && terrain.faction !== Faction.Neutral)
        throw new BoardPlayerConstructionError(`Cannot set ownership of property already owned.\n${FactionColors[this.faction]} taking ownership of ${point.toString()} ${terrain.name} Tile owned by ${FactionColors[terrain.faction]}`);
      terrain.faction = this.faction;
    });

    // Validate and spawn units.
    options.unitSpawns?.forEach( settings => this.spawnUnit(settings) );

    // Collect property count
    this.scanCapturedProperties();

    // Set pre-match known conditions
    this.armyDeployed = (this.units.length > 0);
    this.neverHQ = (this.HQs.length === 0);

    // Get (temp) known number of base locations.
    const spawnTypes = this.scenario.spawnMap.map( m => m.type );
    const bases = this.capturePoints
      .filter( p => spawnTypes.includes(this.map.squareAt(p).terrain.type) );

    // Validate player pre-play options
    if (bases.length === 0 && this.units.length === 0)
      throw new BoardPlayerConstructionError(`BoardPlayer object #${this.playerNumber} has no means of playing.`);

    // Set default cursor position
    const startingCursorPos = this.HQs[0]?.boardLocation
      || bases[0]
      || this.units[0]?.boardLocation
      || new Point(this.map.width/2, this.map.height/2).trunc();
    this.lastCursorPosition = startingCursorPos;
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
    const li = this.capturePoints
      .map( p => this.map.squareAt(p) )
      .filter( s => s.terrain.type === Terrain.HQ );
    return li;
  }

  /** A list of all owned units which are placed on the map and not held inside
   * another unit's cargo or some other nebulous space. */
  get unitsOnMap() {
    return this.units.filter( u => u.onMap );
  }

  /** The number of properties captured by this player. */
  get propertyCount(): number {
    return this.capturePoints.length;
  }

  /** The number of properties which generate income captured by this player. */
  get fungiblePropertyCount(): number {
    return this.capturePoints.filter( p => this.map.squareAt(p).terrain.generatesIncome ).length;
  }

  /** The number of properties which are Com Towers, which by count affect allied unit stats. */
  get comTowerCount(): number {
    return this.capturePoints.filter( p => this.map.squareAt(p).terrain.type === Terrain.ComTower ).length;
  }

  /** The number of deployed units owned by this player. */
  get deployCount(): number {
    return this.units.length;
  }

  /** Returns true if this player has lost this game. */
  get defeated() {
    const headquartersLost = (!this.neverHQ && this.HQs.length === 0);
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
    const { location, serial, hp, ammo, gas, capture, spent } = settings;

    // System log line
    function write(n?: number | boolean) { return (n !== undefined) ? n : ''; }
    Debug.log('BoardPlayer', 'SpawnUnit', {
      message: `${serial} ${location.toString()} hp=${write(hp)} ap=${write(ammo)} gas=${write(gas)} cap=${write(capture)} spent=${write(spent)}`,
    })

    const square = this.map.squareAt(location);
    const unitType = Object.values(Unit).find( u => u.serial === serial );

    if (!unitType)
      throw new SpawnUnitError(`Could not spawn predeploy: Unit serial ${serial} not found.`);

    const unit = new unitType();
    unit.init({
      faction: this.faction,
      boardPlayer: this,     // TODO Unimplemented in UnitObject
    });

    if (square.unit)
      throw new SpawnUnitError(`Could not spawn predeploy: location ${location.toString()} already occupied.`);
    if (!square.occupiable(unit))
      throw new SpawnUnitError(`Could not spawn predeploy: location ${location.toString()} not occupiable.`);

    this.map.placeUnit(unit, location);
    this.units.push(unit);

    // Spawn-new settings
    (unit.canHide) && (unit.hiding = true);

    // Load-in spawn settings
    unit.spent = settings.spent || false;

    // TODO Complete unit spawn settings
    // Units have (had) a state and condition number which describes their HP,
    // their ammo, their capture progress, etc.
    // It isn't comprehensive, because I'm lazy, but those numbers are at least
    // the *main* way I should be serializing unit state for save/load.

    return unit;
  }

  /** Performs clerical work after a unit has been 'killed'.
   * Note: This method *does not* destroy() the called unit. */
  unspawnUnit(unit: UnitObject): UnitObject {
    this.units = this.units.filter( u => u !== unit );
    this.map.removeUnit(unit.boardLocation);
    if (unit.CoOnBoard)
      this.handleCoUnitDestroyed();
    return unit;
  }

  /** Updates this BoardPlayer's list of captured properties by scanning
   * the map for properties with a matching faction. */
  scanCapturedProperties() {
    this.capturePoints = [];
    for (let y = 0; y < this.map.height; y++)
    for (let x = 0; x < this.map.width; x++) {
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

  /** Returns this player's CO unit or undefined.
   * CO unit may not be 'on map,' so be careful out there. */
  getCoUnit() {
    return this.units.find( u => u.CoOnBoard );
  }

  /** True if this player is ready to spawn a CO unit. */
  get canSpawnCO() {
    return (!this.getCoUnit() && this.CoUnitTurnDelay <= 0);
  }

  /** Sets the unit-status indicating a CO could board for all faction units. */
  setCoBoardableIndicators() {
    const { map, scenario } = this;

    this.clearCoBoardableIndicators();

    this.unitsOnMap.forEach( u => {
      const square = map.squareAt(u.boardLocation);
      const spawnMap = scenario.spawnMap.find( tile => tile.type === square.terrain.type );

      const spawnableTerrain = (spawnMap?.units.includes( u.type ) || false);
      const terrainAllied = (square.terrain.faction === this.faction);

      const terrainIsHQ = (square.terrain.type === Terrain.HQ && scenario.CoLoadableFromHQ);
      const unitIsGroundClass = (u.unitClass === UnitClass.Ground);
      const spawnableFromHQ = (terrainIsHQ && unitIsGroundClass);

      const spawnableLocation = (terrainAllied && (spawnableTerrain || spawnableFromHQ));
      const unitOrderable = (u.orderable);
      const canSpawnCo = (this.canSpawnCO);
      const unitAffordable = (u.adjustedCost <= this.funds);

      u.CoCouldBoard = (unitOrderable && unitAffordable && canSpawnCo && spawnableLocation);
    });
  }

  /** Unsets the unit-status indicating a CO could board for all faction units. */
  clearCoBoardableIndicators() {
    this.units.forEach( u => u.CoCouldBoard = false );
  }

  /** Conducts operations relevant to this player after their CO unit has
   * been destroyed. Note: this method does not actually destroy the unit. */
  private handleCoUnitDestroyed() {
    this.CoUnitTurnDelay = 1;   // '1' merely prevents reboarding the turn you get your own unit blown
    this.powerMeter.track = 'min';
  }

  /** Returns true if the given board location is within this player's CO range,
   * the region affected by CO effects. */
  withinCoRange(location: Point) {
    const CoUnit = this.getCoUnit();
    if (!CoUnit)
      return false;

    const max = this.officer.CoZone + this.powerMeterLevel;
    const rangeMap = CommonRangesRetriever({min: 0, max});
    const vector = location.subtract(CoUnit.boardLocation);
    return rangeMap.get(vector);
  }

  /** Increases this player's power meter by an amount proportional to
   * damage dealt. Not implemented here, but this is damage dealt by
   * an allied unit within the CO Zone. This may be attack or counter-
   * attack damage. */
  increasePowerMeter(damage: number) {
    this.powerMeter.increment(damage);
  }

  /** Resets the player's CO power to 0. */
  resetPowerMeter() {
    this.powerMeter.track = 'min';
  }

  /** Returns a number 0 through 12 indicating how many visual meter
   * segments are filled by this player's stored CO power. */
  get powerMeterSegments() {
    return Math.floor(this.powerMeter.output / 50);
  }

  /** Returns a number 0, 1 or 2 indicating which degree of CO power
   * stored up this player has. */
  get powerMeterLevel() {
    return Math.floor(this.powerMeter.output / 50 / 6);
  }

}
