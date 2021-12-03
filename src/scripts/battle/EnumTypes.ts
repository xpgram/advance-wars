
/** The various movement types units may use to traverse the map. */
export enum MoveType {
  Infantry,
  Mech,
  TireA,
  TireB,
  Tread,
  Air,
  Ship,
  Transport,
}

export function MoveTypeString(t: MoveType) {
  return [
    'Inftry',
    'Mech',
    'TireA',
    'TireB',
    'Tread',
    'Air',
    'Ship',
    'Trpt',
  ][t];
}

/** The various armor classes 'worn' by units and attackable by others.
 * This type is a targeting system; it does not implicitly affect damage. */
export enum ArmorType {
  Infantry,
  Vehicle,
  Air,
  Heli,
  Ship,
  Sub,
}

export function ArmorTypeString(t: ArmorType) {
  return [
    'Inftry',
    'Veh',
    'Air',
    'Heli',
    'Ship',
    'Sub',
  ][t];
}

/** Used to describe a unit's method of attack: which of their two weapons they'll be using. */
export enum AttackMethod {
  None,
  Primary,
  Secondary,
}

/** The various kinds of units one might be. Useful for targeting broad unit-types, like which kind cities will repair. */
export enum UnitClass {
  None,
  Ground,
  Naval,
  Air,
}

/** The various team factions a unit or building might belong to. */
export enum Faction {
  None,
  Neutral,
  Red,    // 12th Battalion
  Blue,   // Lazurian Army
  Yellow, // New Rubinelle Army / NRA
  Black,  // Intelligence Defense Systems / IDS
}

/** The various team factions a unit or building might belong to (as a string.) */
export const FactionColors = [
  'white',
  'white',
  'red',
  'blue',
  'yellow',
  'black',
]

/** The terrain tileset to use for visually constructing maps. */
export enum TerrainTileSet {
  Normal,
  Snow,
  Ruin,
  Desert,
}

/** The weather conditions a battle might be subjected to. */
export enum Weather {
  Clear,
  Snow,
  Sandstorm,
  FogOfWar,
}

/** Indicates which global priority set an AI will exhibit. */
export enum AIPlayStyle {
  Balanced,
  Aggressive,
  Defensive,
}

/** Indicates which kind of action a turn event represents. */
export enum Instruction {
  Wait,
  Attack,
  Capture,  // Build when APC
  Supply,
  Flare,
  SelfDestruct,
  Join,
  Load,
  Unload,
  SpawnUnit,
  SpawnLoadUnit,
  Destroy,        // Like when player destroys from menu.
  LoadCO,
  Silo,
  EndTurn,
}