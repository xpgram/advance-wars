import { MapData } from "./MapData";
import { Terrain } from "../scripts/battle/map/Terrain";
import { Common } from "../scripts/CommonUtils";
import { Debug } from "../scripts/DebugUtils";

const H = Terrain.HQ.serial;
const B = Terrain.Factory.serial;

function buildBlankMap(width: number, height: number, msg?: string): MapData {
  Debug.assert(width >= 5 && height >= 5, `Map dimensions shorter than 5 tiles are not allowed: tried width=${width} and height=${height}`);

  msg = msg ?? '';

  const map = <MapData>{
    name: `Design ${width}x${height} ${msg}`,
    size: { width, height },
    players: 4,
    map: Common.Array2D(height, width, 0),
    owners: [
      { "location": { "x": 0, "y": 0 }, "player": 0 },
      { "location": { "x": 0, "y": 1 }, "player": 0 },
      { "location": { "x": 1, "y": 0 }, "player": 1 },
      { "location": { "x": 1, "y": 1 }, "player": 1 },
      { "location": { "x": 2, "y": 0 }, "player": 2 },
      { "location": { "x": 2, "y": 1 }, "player": 2 },
      { "location": { "x": 3, "y": 0 }, "player": 3 },
      { "location": { "x": 3, "y": 1 }, "player": 3 },
    ],
    predeploy: [],
  };

  for (let i = 0; i < 4; i++) {
    map.map[0][i] = H;
    map.map[1][i] = B;
  }

  return map;
}

export const maps = <MapData[]>[
  // Demo and Dev rooms
  {
    "name": "Demo Island",
    "size": { "width": 16, "height": 15 },
    "players": 2,
    "map": [
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 0, 2, 4, 4, 2, 0, 9, 9, 9, 9, 9],
      [9, 9, 9, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 9, 9, 9],
      [9, 9, 2, 20, 3, 2, 20, 20, 20, 20, 2, 3, 20, 2, 9, 9],
      [9, 9, 2, 1, 2, 3, 1, 3, 3, 1, 3, 2, 1, 2, 9, 9],
      [9, 9, 24, 1, 3, 1, 1, 1, 1, 1, 1, 3, 1, 24, 9, 9],
      [9, 24, 1, 1, 3, 1, 20, 2, 2, 20, 1, 3, 1, 1, 24, 9],
      [9, 19, 24, 1, 3, 1, 20, 4, 4, 20, 1, 3, 1, 24, 19, 9],
      [9, 24, 2, 1, 1, 1, 2, 3, 3, 2, 1, 1, 1, 2, 24, 9],
      [9, 0, 0, 23, 4, 20, 3, 3, 3, 3, 20, 4, 23, 0, 0, 9],
      [9, 20, 20, 0, 2, 2, 3, 2, 2, 3, 2, 2, 0, 20, 20, 9],
      [9, 9, 9, 3, 9, 9, 3, 0, 0, 3, 9, 9, 3, 9, 9, 9],
      [9, 9, 0, 9, 9, 9, 9, 21, 21, 9, 9, 9, 9, 0, 9, 9],
      [9, 9, 9, 9, 9, 13, 9, 9, 9, 9, 13, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    ],
    "owners": [
      { "location": { "x": 3, "y": 3 }, "player": 0 },
      { "location": { "x": 2, "y": 5 }, "player": 0 },
      { "location": { "x": 1, "y": 6 }, "player": 0 },
      { "location": { "x": 1, "y": 7 }, "player": 0 },
      { "location": { "x": 2, "y": 7 }, "player": 0 },
      { "location": { "x": 1, "y": 8 }, "player": 0 },
      { "location": { "x": 5, "y": 9 }, "player": 0 },
      { "location": { "x": 1, "y": 10 }, "player": 0 },
      { "location": { "x": 2, "y": 10 }, "player": 0 },
      { "location": { "x": 12, "y": 3 }, "player": 1 },
      { "location": { "x": 13, "y": 5 }, "player": 1 },
      { "location": { "x": 14, "y": 6 }, "player": 1 },
      { "location": { "x": 13, "y": 7 }, "player": 1 },
      { "location": { "x": 14, "y": 7 }, "player": 1 },
      { "location": { "x": 14, "y": 8 }, "player": 1 },
      { "location": { "x": 10, "y": 9 }, "player": 1 },
      { "location": { "x": 13, "y": 10 }, "player": 1 },
      { "location": { "x": 14, "y": 10 }, "player": 1 },
    ],
    "predeploy": [
    ],
  },
  {
    "name": "DevRoom Sm 2P",
    "size": { "width": 7, "height": 7 },
    "players": 2,
    "map": [
      [0, 25, 2, 2, 21, 8, 14],
      [20, 19, 24, 2, 22, 6, 2],
      [0, 24, 15, 26, 9, 28, 4],
      [16, 16, 16, 9, 9, 12, 4],
      [15, 20, 3, 3, 9, 12, 27],
      [20, 19, 1, 1, 6, 5, 23],
      [24, 24, 0, 24, 9, 10, 9],
    ],
    "owners": [
      { "location": { "x": 1, "y": 0 }, "player": 0 },
      { "location": { "x": 0, "y": 1 }, "player": 0 },
      { "location": { "x": 1, "y": 1 }, "player": 0 },
      { "location": { "x": 2, "y": 1 }, "player": 0 },
      { "location": { "x": 1, "y": 2 }, "player": 0 },
      { "location": { "x": 1, "y": 4 }, "player": 1 },
      { "location": { "x": 0, "y": 5 }, "player": 1 },
      { "location": { "x": 1, "y": 5 }, "player": 1 },
      { "location": { "x": 0, "y": 6 }, "player": 1 },
      { "location": { "x": 1, "y": 6 }, "player": 1 },
    ],
    "predeploy": [
    ]
  },
  {
    "name": "DevRoom Lg 4P",
    "size": { "width": 32, "height": 27 },
    "players": 4,
    "map": [
      [0, 2, 2, 2, 1, 2, 3, 3, 2, 2, 0, 0, 0, 2, 2, 3, 3, 3, 3, 3, 3, 3, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 1, 0, 2, 3, 3, 2, 0, 20, 0, 24, 0, 2, 3, 3, 3, 3, 0, 0, 20, 20, 0, 2, 0, 0, 2, 2, 2, 0],
      [0, 0, 19, 0, 1, 0, 2, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 20, 0, 0, 2, 2],
      [0, 0, 0, 0, 1, 20, 0, 2, 3, 3, 1, 0, 0, 0, 0, 0, 3, 3, 24, 0, 22, 0, 0, 20, 0, 0, 1, 0, 0, 0, 0, 2],
      [0, 2, 0, 20, 1, 0, 0, 0, 0, 0, 1, 0, 0, 9, 9, 9, 3, 3, 0, 0, 0, 0, 0, 0, 20, 0, 24, 0, 0, 20, 0, 2],
      [0, 2, 2, 0, 1, 25, 0, 2, 20, 20, 1, 0, 9, 9, 9, 9, 9, 9, 0, 2, 0, 20, 20, 0, 2, 24, 19, 24, 0, 0, 0, 2],
      [9, 0, 0, 24, 1, 1, 1, 1, 1, 1, 1, 2, 9, 9, 14, 9, 9, 9, 9, 9, 2, 2, 0, 2, 0, 0, 24, 0, 0, 0, 2, 2],
      [9, 9, 0, 0, 2, 0, 0, 0, 2, 3, 1, 0, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 25, 0, 25, 0, 0, 2, 2],
      [9, 9, 9, 0, 2, 2, 20, 20, 2, 3, 1, 0, 24, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0, 0, 2, 2, 2],
      [9, 9, 6, 0, 0, 2, 2, 2, 2, 3, 1, 20, 3, 0, 0, 9, 9, 9, 13, 9, 9, 9, 9, 9, 10, 0, 0, 0, 2, 9, 9, 2],
      [9, 9, 6, 9, 0, 0, 0, 2, 2, 2, 1, 1, 1, 1, 0, 3, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 2, 0, 2, 2],
      [9, 9, 6, 9, 6, 9, 0, 0, 2, 2, 3, 3, 3, 1, 0, 3, 0, 0, 9, 9, 13, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0],
      [9, 1, 1, 6, 6, 9, 0, 0, 0, 2, 20, 3, 3, 1, 20, 3, 3, 0, 0, 9, 9, 9, 9, 9, 9, 13, 9, 9, 9, 9, 2, 0],
      [9, 20, 3, 9, 6, 9, 9, 0, 0, 0, 2, 2, 3, 1, 1, 1, 20, 0, 0, 0, 26, 9, 9, 13, 9, 9, 9, 9, 9, 9, 0, 2],
      [9, 20, 0, 9, 0, 9, 9, 9, 9, 0, 0, 2, 2, 20, 3, 3, 0, 20, 0, 24, 0, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 2],
      [9, 9, 6, 0, 24, 2, 9, 9, 9, 9, 0, 0, 0, 2, 2, 2, 0, 0, 24, 0, 24, 9, 9, 10, 9, 9, 9, 9, 9, 9, 9, 0],
      [9, 9, 9, 24, 19, 24, 9, 9, 9, 9, 9, 0, 0, 0, 0, 2, 2, 2, 0, 24, 0, 0, 0, 0, 10, 10, 9, 9, 9, 9, 9, 9],
      [9, 20, 6, 0, 24, 0, 26, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0, 2, 2, 2, 2, 0, 25, 0, 0, 2, 10, 9, 9, 9, 9, 9],
      [9, 20, 9, 9, 10, 10, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 2, 0, 19, 10, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 20, 23, 2, 0, 2, 2, 0, 0, 0, 2, 10, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 0, 2, 0, 10, 10, 0, 2, 10, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 0, 2, 2, 9, 9, 10, 10, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 0, 2, 2, 0, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 2, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    ],
    "owners": [
      { "location": { "x": 14, "y": 12 }, "player": 0 },
      { "location": { "x": 16, "y": 13 }, "player": 0 },
      { "location": { "x": 20, "y": 13 }, "player": 0 },
      { "location": { "x": 17, "y": 14 }, "player": 0 },
      { "location": { "x": 19, "y": 14 }, "player": 0 },
      { "location": { "x": 18, "y": 15 }, "player": 0 },
      { "location": { "x": 20, "y": 15 }, "player": 0 },
      { "location": { "x": 19, "y": 16 }, "player": 0 },
      { "location": { "x": 26, "y": 18 }, "player": 0 },
      { "location": { "x": 27, "y": 2 }, "player": 1 },
      { "location": { "x": 18, "y": 3 }, "player": 1 },
      { "location": { "x": 23, "y": 3 }, "player": 1 },
      { "location": { "x": 24, "y": 4 }, "player": 1 },
      { "location": { "x": 26, "y": 4 }, "player": 1 },
      { "location": { "x": 29, "y": 4 }, "player": 1 },
      { "location": { "x": 21, "y": 5 }, "player": 1 },
      { "location": { "x": 22, "y": 5 }, "player": 1 },
      { "location": { "x": 25, "y": 5 }, "player": 1 },
      { "location": { "x": 26, "y": 5 }, "player": 1 },
      { "location": { "x": 27, "y": 5 }, "player": 1 },
      { "location": { "x": 26, "y": 6 }, "player": 1 },
      { "location": { "x": 25, "y": 7 }, "player": 1 },
      { "location": { "x": 27, "y": 7 }, "player": 1 },
      { "location": { "x": 2, "y": 2 }, "player": 2 },
      { "location": { "x": 5, "y": 3 }, "player": 2 },
      { "location": { "x": 3, "y": 4 }, "player": 2 },
      { "location": { "x": 5, "y": 5 }, "player": 2 },
      { "location": { "x": 3, "y": 6 }, "player": 2 },
      { "location": { "x": 6, "y": 8 }, "player": 2 },
      { "location": { "x": 7, "y": 8 }, "player": 2 },
      { "location": { "x": 4, "y": 15 }, "player": 3 },
      { "location": { "x": 3, "y": 16 }, "player": 3 },
      { "location": { "x": 4, "y": 16 }, "player": 3 },
      { "location": { "x": 5, "y": 16 }, "player": 3 },
      { "location": { "x": 1, "y": 17 }, "player": 3 },
      { "location": { "x": 4, "y": 17 }, "player": 3 },
      { "location": { "x": 6, "y": 17 }, "player": 3 },
      { "location": { "x": 1, "y": 18 }, "player": 3 },
    ],
    "predeploy": [
      { "location": { "x": 23, "y": 7 }, "serial": 0, "player": 0 },
      { "location": { "x": 23, "y": 6 }, "serial": 13, "player": 0 },
      { "location": { "x": 22, "y": 7 }, "serial": 2, "player": 0 },
      { "location": { "x": 24, "y": 8 }, "serial": 6, "player": 0 },
      { "location": { "x": 22, "y": 14 }, "serial": 22, "player": 0 },
      { "location": { "x": 21, "y": 15 }, "serial": 23, "player": 0 },
      { "location": { "x": 25, "y": 15 }, "serial": 24, "player": 0 },
      { "location": { "x": 24, "y": 16 }, "serial": 27, "player": 0 },
      { "location": { "x": 23, "y": 15 }, "serial": 26, "player": 0 },
      { "location": { "x": 22, "y": 16 }, "serial": 7, "player": 0 },
      { "location": { "x": 21, "y": 16 }, "serial": 6, "player": 0 },
      { "location": { "x": 23, "y": 17 }, "serial": 4, "player": 0 },
      { "location": { "x": 20, "y": 17 }, "serial": 14, "player": 0 },
      { "location": { "x": 20, "y": 14 }, "serial": 20, "player": 0 },
      { "location": { "x": 19, "y": 14 }, "serial": 1, "player": 0 },
      { "location": { "x": 26, "y": 5 }, "serial": 11, "player": 1 },
      { "location": { "x": 25, "y": 4 }, "serial": 7, "player": 1 },
    ],
  },

  // Blank maps
  ...(<[number, number, string?][]>[
    [10,10],
    [15,15],
    [20,20],
    [30,30],
    [50,50],
    [70,40,  "mmap max"],
    [100,100,"lag king"],
  ]).map( ([w,h,m]) => buildBlankMap(w,h,m) ),
];