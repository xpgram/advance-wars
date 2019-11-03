
/** The various movement types units may use to traverse the map. */
export enum MoveType {
    Infantry,
    Mech,
    TireA,
    TireB,
    Tread,
    Air,
    Ship,
    Transport
}

/** The various armor classes 'worn' by units and attackable by others.
 * This type is a targeting system; it does not implicitly affect damage. */
export enum ArmorType {
    Infantry,
    Vehicle,
    Air,
    Heli,
    Ship,
    Sub
}

/** The various kinds of units one might be. Useful for targeting broad unit-types, like which kind cities will repair. */
export enum UnitClass {
    None,
    Ground,
    Naval,
    Air
}

/** The various team factions a unit or building might belong to. */
export enum Faction {
    None,
    Neutral,
    Red,    // 12th Battalion
    Blue,   // Lazurian Army
    Yellow, // New Rubinelle Army / NRA
    Black   // Intelligence Defense Systems / IDS
}

/** The various team factions a unit or building might belong to (as a string.) */
export var FactionColors = [
    'white',
    'white',
    'red',
    'blue',
    'yellow',
    'black'
];