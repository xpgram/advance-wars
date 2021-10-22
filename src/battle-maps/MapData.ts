
/** The data type for map construction data.
 * This is intended for new, game-start map constructions, but also
 * for mid-turn save-and-reload constructions, which could be obtained
 * from the multiplayer server.
 */
export type MapData = {
  name: string,
  players: number,
  size: {width: number, height: number},
  map: Array<Array<number>>,
  owners: {location: {x: number, y: number}, player: number}[],
  predeploy: {location: {x: number, y: number}, serial: number, player: number}[]
}