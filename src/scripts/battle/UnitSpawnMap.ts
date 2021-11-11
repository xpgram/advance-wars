import { Terrain } from "./map/Terrain";
import { TerrainType } from "./map/TerrainObject";
import { Unit } from "./Unit";
import { UnitType } from "./UnitObject";

/** Links a list of units to a Terrain or Unit type, in effect describing which
 * units may be spawned on or in that type.
 * */
export class UnitSpawnMap {

  /** The type-key associated with this unit map. */
  readonly type: TerrainType | UnitType;

  /** The list of units which may spawn with this associated type. */
  get units(): UnitType[] { return this._units.slice(); }
  private _units: UnitType[];

  constructor(type: TerrainType | UnitType, units: UnitType[]) {
    this.type = type;
    this._units = units;
  }
}

/** A list of UnitSpawnMaps linking types to spawnable unit types. */
export const defaultUnitSpawnMap = [
  new UnitSpawnMap(Terrain.Factory, [
    Unit.Infantry,
    Unit.Mech,
    Unit.Bike,
    Unit.Recon,
    Unit.Tank,
    Unit.AntiAir,
    Unit.Artillery,
    Unit.MdTank,
    Unit.WarTank,
    Unit.AntiTank,
    Unit.Rockets,
    Unit.Missiles,
    Unit.Flare,
    Unit.Rig,
  ]),
  new UnitSpawnMap(Terrain.Airport, [
    Unit.Fighter,
    Unit.Bomber,
    Unit.Stealth,
    Unit.BlackBomb,
    Unit.Duster,
    Unit.BCopter,
    Unit.TCopter,
  ]),
  new UnitSpawnMap(Terrain.Port, [
    Unit.Carrier,
    Unit.Battleship,
    Unit.Cruiser,
    Unit.Submarine,
    Unit.Lander,
    Unit.GunBoat,
  ]),
  new UnitSpawnMap(Unit.Carrier, [
    Unit.SeaPlane,
  ]),
];