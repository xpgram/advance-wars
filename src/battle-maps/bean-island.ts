export type MapData = {
  name: string,
  players: number,
  size: {width: number, height: number},
  map: Array<Array<number>>,
  owners: {x: number, y: number, player: number}[],
  predeploy: {x: number, y: number, serial: number, player: number}[]
}

export const data = {
  "name": "Bean Island",
  "players": 2,
  "size": {"width": 16, "height": 15},
  "map": [
    [ 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8 ],
    [ 8, 8, 8, 8, 8, 0, 0, 8, 8, 8, 0, 3, 8, 8, 8, 8 ],
    [ 8, 8, 0, 0, 3, 2, 2, 2, 2, 2, 2, 3, 3, 0, 8, 8 ],
    [ 8, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 8 ],
    [ 8,19,19, 3, 3,19,19,19,19,19,19, 3, 3,19,19, 8 ],
    [ 8, 0, 0, 0, 3, 1, 1, 1, 1, 1, 1, 3, 0, 0, 0, 8 ],
    [ 8,23, 0,23, 3, 1, 0, 3, 3, 0, 1, 3,23, 0,23, 8 ],
    [ 8,18,23, 1, 3, 1,19, 3, 3,19, 1, 3, 1,23,18, 8 ],
    [ 8,23, 2, 1, 3, 1, 0, 3, 3, 0, 1, 3, 1, 2,23, 8 ],
    [ 8, 0, 0, 1, 1, 1,19, 3, 3,19, 1, 1, 1, 0, 0, 8 ],
    [ 8,19,19, 0, 2, 2, 3, 3, 3, 3, 2, 2, 2,19,19, 8 ],
    [ 8, 8, 8, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 8, 8 ],
    [ 8,12, 8, 8, 0, 0, 8, 8, 8, 8, 8, 0, 8, 8, 8, 8 ],
    [ 8, 8, 8, 8, 8, 8, 8, 8,12, 8, 8, 8, 8, 8, 8, 8 ],
    [ 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8 ],
  ],
  "owners": [
    {"x": 1, "y": 4, "player": 1},
    {"x": 2, "y": 4, "player": 1},
    {"x": 1, "y": 6, "player": 1},
    {"x": 3, "y": 6, "player": 1},
    {"x": 1, "y": 7, "player": 1},
    {"x": 2, "y": 7, "player": 1},
    {"x": 1, "y": 8, "player": 1},
    {"x": 1, "y":10, "player": 1},
    {"x": 2, "y":10, "player": 1},
    {"x": 6, "y": 7, "player": 1},
    {"x": 6, "y": 9, "player": 1},
    {"x":13, "y": 4, "player": 2},
    {"x":14, "y": 4, "player": 2},
    {"x":12, "y": 6, "player": 2},
    {"x":14, "y": 6, "player": 2},
    {"x": 9, "y": 7, "player": 2},
    {"x":13, "y": 7, "player": 2},
    {"x":14, "y": 7, "player": 2},
    {"x":14, "y": 8, "player": 2},
    {"x": 9, "y": 9, "player": 2},
    {"x":13, "y":10, "player": 2},
    {"x":14, "y":10, "player": 2}
  ],
  "predeploy": [
    {"x": 3, "y": 8, "serial": 7, "player": 1},
    {"x": 4, "y": 9, "serial": 6, "player": 1},
    {"x": 2, "y":10, "serial": 0, "player": 1},
    {"x": 2, "y": 7, "serial": 2, "player": 1},
    {"x":12, "y": 8, "serial": 7, "player": 2},
    {"x":11, "y": 9, "serial": 6, "player": 2},
    {"x":14, "y": 7, "serial":11, "player": 2}
  ]
}