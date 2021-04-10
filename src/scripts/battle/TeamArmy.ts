import { UnitObject } from "./UnitObject";
import { Slider } from "../Common/Slider";

const MAX_UNITS = 50;

export class TeamArmy {
    color: 'red' | 'blue' | 'yellow' | 'black'; // TODO What is the enum for this?
    officer: OfficerObject;     // Reference to CO class, like Unit.??? or Terrain.???
    powerMeter: Slider;         // How much power meter is charged.
    funds: number;              // Funds available for spending.
    occupiedCityCount: number;  // The count of fund-giving cities owned; probs obtained from Map.
    units: UnitObject[] = [];   // List of units under control.
}