import { UnitObject } from "./UnitObject";
import { Slider } from "../Common/Slider";
import { Map } from "./map/Map";
import { Point } from "../Common/Point";
import { CommandingOfficer } from "./CommandingOfficer";
import { Faction } from "./EnumTypes";

// How many funds each city earns you at the start of each turn.
// This value is temporary and should be configurable per match; should probably
// be in some match settings class.
const FUNDS_PER_CITY = 1000;

// This is a conventional limit; should also probably be in
// configuration settings somewhere.
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
  /** Board location of player headquarters.
   * Every point must be the location of an HQ tile unassumed by any other players. */
  hqLocations: Point[],

  // Pre-deploy configurables.
  powerMeter?: number,        // Default 0
  funds?: number,             // Default 0
  units?: UnitObject[],       // Default []; Constructor must convert to *this* team.
};

/** The player-data object for a participant in a game. */
export class BoardPlayer {
  map: Map;
  playerNumber: number;       // Which real player (slot) this player-object belongs to.
  faction: Faction;           // The army-color owned by this player, more or less.
  officer: CommandingOfficer; // Reference to CO class, like Unit.??? or Terrain.???
  hqLocations: Point[];       // Where this player's HQs are located.
  powerMeter: Slider;         // How much power meter is charged.
  funds: number;              // Funds available for spending.
  occupiedCityCount: number;  // The count of fund-giving cities owned; probs obtained from Map.
  units: UnitObject[] = [];   // List of units under control.

  constructor(options: BoardPlayerOptions) {
    this.map = options.map;
    this.playerNumber = options.playerNumber;
    this.faction = options.faction;
    this.powerMeter = new Slider({max: 128}); // TODO COWindow uses 0-12, so convert or refactor.
    this.funds = 0;

    this.occupiedCityCount = 0; // TODO Gather from map iter.

    this.units = options.units || [];

    this.officer = options.officerSerial; // TODO Convert to a new officer object.

    this.hqLocations = options.hqLocations; // TODO Validate and set ownership.

    // TODO Convert buildings to this faction given a list of points. Map doesn't need to sully itself.

    // TODO Spawn units given a list of points and states. Map doesn't need to sully itself.
  }

  /**  */
  destroy() {
    // stub
    // TODO unbind references to map and units and blah blah blah.
    // Units will have a reference to this, probably, so this will be important.
  }

  private get HQ() {
    return this.map.squareAt(this.headquartersLocation).terrain;
  }

  /** Returns true if this player has lost this game. */
  get defeated() {
    const headquartersLost = (this.HQ.faction !== this.faction);
    const armyDefeated = (this.armyDeployed && this.units.length === 0);
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

  /** Raises this player's available funds by an amount multiplied by the
   * number of owned cities. */
  collectFunds() {
    this.funds += this.occupiedCityCount * FUNDS_PER_CITY;
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