import { UnitObject } from "./UnitObject";
import { Slider } from "../Common/Slider";
import { Map } from "./map/Map";
import { Point } from "../Common/Point";

const FUNDS_PER_CITY = 1000;        // How many funds each city earns you at the start of each turn.
    // This value is temporary and should be configurable per match; should probably
    // be in some match settings class.

const MAX_UNITS = 50;

type BoardPlayerOptions = {
    /** The team color. */
    color: number, // TODO What is the enum for this?
    /** The officer being played as. */
    officer: CommandingOfficerObject,
    /** Reference to the board being played on. */
    map: Map,
    /** Board location of player headquarters. */
    hqLocation: Point,

    // Pre-deploy configurables.
    powerMeter?: number,        // Default 0
    funds?: number,             // Default 0
    units?: UnitObject[],       // Default []; Constructor must convert to *this* team.
};

export class BoardPlayer {
    map: Map;
    faction: 'red' | 'blue' | 'yellow' | 'black'; // TODO What is the enum for this?
    officer: OfficerObject;     // Reference to CO class, like Unit.??? or Terrain.???
    powerMeter: Slider;         // How much power meter is charged.
    funds: number;              // Funds available for spending.
    occupiedCityCount: number;  // The count of fund-giving cities owned; probs obtained from Map.
    units: UnitObject[] = [];   // List of units under control.

    constructor(options: BoardPlayerOptions) {


        // Use reference to map to count, or ask map to count.
        this.occupiedCityCount = 0;

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
        this.units.forEach( (unit) => {
            unit.orderable = true;
        });
    }

    /** Sets all owned units to unorderable. */
    // TODO orderable=false and deactivated (not my turn) are different qualities.
    deactivateAllUnits() {
        this.units.forEach( (unit) => {
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