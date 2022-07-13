import { AiPlayStyle, Faction } from "../scripts/battle/EnumTypes"

/** The data type for map construction data.
 * This is intended for new, game-start map constructions, but also
 * for mid-turn save-and-reload constructions, which could be obtained
 * from the multiplayer server.
 */
export type MapData = {
  name: string,
  players: number,

  size: {
    width: number,
    height: number
  },

  /** The serial numbers which describe the map terrain. Be aware this is arranged in [y][x] form.
   * Why? I have no idea. I can't remember. Probably a Map.ts convention that made posting to the
   * console easier. */
  map: number[][],

  // TODO This should take over 'players', but that will require some refactoring
  playerData?: {
    funds?: number,
    coPower?: number,
    color?: Faction,    // The intent is to allow player 2 to be black instead of blue or something.
  }[],

  owners: {
    location: {
      x: number,
      y: number
    },
    player: number
  }[],

  predeploy: {
    location: {
      x: number,
      y: number
    },
    serial: number,
    player: number,

    hp?: number,
    gas?: number,
    ammo?: number,
    capture?: number,
    rank?: number,

    // ...anything else?

    /** Whether this is a CO unit. */
    coAnnointed?: boolean,
    /** how the AI system treats this particular unit; overrides the global, default setting. */
    aiStyle?: AiPlayStyle,
    /** only relevant to submarines and other stealth-able troops. if undefined, uses default spawn behavior. */
    isHiding?: boolean,
    /** only used by the predeploy system to guarantee proper spawn ordering */
    isCargo?: boolean,
  }[],
}