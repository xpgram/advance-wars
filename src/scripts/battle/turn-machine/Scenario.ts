import { TerrainTileSet, Weather } from "../EnumTypes";
import { defaultUnitSpawnMap, UnitSpawnMap } from "../UnitSpawnMap";


/** Default rules and settings for a war game. */
export const defaultScenario = {
  /** Whether tiles will be hidden unless inside the vision range of an allied unit.
   * @default false
   **/
  fogOfWar: false,

  /** Which weather conditions the battle will rage in. Weather has deleterious
   * effects on units. @default Clear
   **/
  weather: Weather.Clear,

  /** Which graphics set to use. I need Snow for Olaf, but otherwise I don't actually
   * care about this one.
   * @default Normal
   **/
  terrainGraphics: TerrainTileSet.Normal,

  /** How many days (turns) the battle will go on for before it is decided by player
   * standing. Set to < 1 for infinite.
   * @default -1
   **/
  dayLimit: -1,

  /** How many properties a player can capture to win the game. Set to < 1 for infinite.
   * @default -1
   **/
  propertiesToWin: -1,

  /** Funds granted to each player on their first turn.
   * @default 0
   **/
  startingFunds: 0,

  /** Funds granted per fungible captured property on turn start.
   * @default 1000
   **/
  incomePerTaxableProperty: 1000,

  /** AI play style: aggressive, defensive, balanced, etc.
   * @default Balanced
   **/
  // aiPlaystyle: AIPlayStyle.Balanced,

  /** Whether units get more powerful/experienced after defeating another unit.
   * @default True
   **/
  rankUp: true,

  /** The maximum number of deployed units a player may have on the board.
   * @default 50
   **/
  unitLimit: 50,

  /** How much HP a unit will restore when starting a turn on a repairing tile.
   * @default 20
   **/
  repairHp: 20,

  /** Whether an HQ tile remains an HQ on capture or becomes a City tile.
   * @default False
   **/
  acquireHqOnCapture: false,

  /** Whether allied players share FoW vision ranges.
   * @default False
   **/
  sharedSightMap: false,

  /** Whether troops on the board may be boarded by the player's CO and benefit
   * from all the effects that entails (CO Zone, CO Powers, etc.)
   * @default True
   **/
  CoUnits: true,

  /** Whether CO-boarded troops may use their CO Power when they have a full
   * power meter. Note: This has the potential to really unbalance the game.
   * @default True
   **/
  CoPowers: true,

  /** Whether a CO may board a troop from the HQ, or if it must be from a
   * factory base.
   * @default True
   **/
  CoLoadableFromHQ: true,

  /** Whether resupplying units, like Rigs, which can resupply the gas of other
   * troops, will themselves have infinite gas.
   * @default True
   **/
  resuppliersInfiniteGas: true,

  /** A map that lists all of the purchasable troops and which terrain or troop
   * they may be purchased from.
   **/
  spawnMap: defaultUnitSpawnMap as UnitSpawnMap[],

  /** Whether this match is a remote-server multiplayer match or a locally held
   * one.
   * @default False
   **/
  remoteMultiplayerMatch: false,
};


/** The rules and settings for a war game. */
export type Scenario = typeof defaultScenario;
