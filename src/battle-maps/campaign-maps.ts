import { MapData } from "./MapData";

export const maps = <MapData[]>[
  {
    "name": "C12: History of Hate",
    "size": { "width": 20, "height": 14 },
    "players": 3,
    "map": [
      [ 2, 0, 0, 2, 2, 0, 0, 0, 3, 0, 0, 0, 0, 3, 3, 0, 0, 2, 0, 0],
      [ 9,10,10, 9, 9,10,10,10, 9,10,10,10,10, 9, 9, 9, 9, 9, 9, 0],
      [13, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0, 0],
      [ 9, 9,11,11,11,11,11,11,11,11,11,11,11,11, 9,10,10,10, 9, 9],
      [ 9, 9, 9, 9, 9,13, 9, 9, 9,12,12,12, 9, 9,13, 9, 9, 9,10, 0],
      [ 0,10, 9, 9, 9, 9, 9, 9,12,12,12,12,12, 9, 9, 9,13, 9,10, 0],
      [ 2, 0, 0, 0, 0, 9, 9,12,12,12,12,12,12,12, 9, 9, 9, 9,10, 0],
      [ 0, 0, 2,10, 9, 9,12,12,12,12,12,12,12,12,12, 9, 9, 0, 0, 0],
      [ 0,10, 9, 9, 9, 9, 9,12,12,12,12,12,12,12, 9, 0, 0, 0,10, 9],
      [10, 9, 9, 9,13, 9, 9, 9,12,12,12,12,12, 9, 9, 9, 9, 9, 9, 9],
      [ 9,10,10,10, 9, 9,13, 9, 9,12,12,12, 9, 9, 9, 9, 9,13, 9, 9],
      [ 0, 0, 0, 0, 9,11,11,11,11,11,11,11,11,11,11,11,11, 9, 9,13],
      [ 2, 9, 9, 9, 9, 9,10,10,10,10, 9, 9,10,10, 9, 9,10,10, 9, 9],
      [ 3, 3, 0, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0, 0, 2, 2, 0, 0, 3, 2],
    ],
    "owners": [
    ],
    "tileData": [
    ],
    "predeploy": [
      {"location": {"x":  8, "y": 12}, "serial": 27, "player": 0},
      {"location": {"x":  4, "y": 12}, "serial": 25, "player": 0},
      {"location": {"x":  6, "y": 11}, "serial": 25, "player": 0},
      {"location": {"x": 11, "y": 12}, "serial": 24, "player": 0},
      {"location": {"x":  4, "y":  9}, "serial": 27, "player": 0},
      {"location": {"x":  3, "y":  8}, "serial": 24, "player": 0},
      {"location": {"x":  3, "y": 10}, "serial": 26, "player": 0},
      {"location": {"x":  2, "y": 10}, "serial": 17, "player": 0},
      {"location": {"x":  2, "y": 12}, "serial": 22, "player": 0},
      {"location": {"x":  7, "y": 13}, "serial": 13, "player": 0},
      {"location": {"x":  0, "y":  7}, "serial": 13, "player": 0},
      {"location": {"x":  2, "y":  6}, "serial": 19, "player": 0},
      {"location": {"x":  7, "y":  4}, "serial": 27, "player": 1},
      {"location": {"x":  9, "y": 10}, "serial": 27, "player": 1},
      {"location": {"x": 17, "y": 11}, "serial": 27, "player": 1},
      {"location": {"x": 18, "y": 10}, "serial": 22, "player": 1},
      {"location": {"x": 17, "y":  1}, "serial": 22, "player": 1},
      {"location": {"x": 12, "y":  9}, "serial": 25, "player": 1},
      {"location": {"x": 14, "y":  1}, "serial": 25, "player": 1},
      {"location": {"x":  7, "y":  7}, "serial": 22, "player": 1},
      {"location": {"x": 17, "y":  4}, "serial": 24, "player": 1},
      {"location": {"x": 19, "y":  7}, "serial": 14, "player": 1},
      {"location": {"x": 18, "y":  2}, "serial": 15, "player": 1},
      {"location": {"x": 13, "y":  3}, "serial": 19, "player": 1},
      {"location": {"x":  2, "y":  5}, "serial": 19, "player": 2},
      {"location": {"x":  2, "y":  3}, "serial": 19, "player": 2},
      {"location": {"x":  3, "y":  4}, "serial": 17, "player": 2},
    ],
  },
  {
    "name": "C13: Greyfield Strikes",
    "size": { "width": 20, "height": 14 },
    "players": 3,
    "map": [
      [ 9, 9,13, 9,20, 1, 1, 1, 1, 1, 1,24, 1, 0, 1,20, 2, 0, 0,19],
      [ 9, 9, 9, 9,10,10,10,10, 9,26, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [ 9,13, 9, 9, 9, 9, 9, 9, 9,26, 1, 2,20, 3,10,10,10, 1, 3, 1],
      [ 9, 9, 9, 9,20, 1, 1,20, 1, 1, 1, 3, 9, 9, 9, 9, 9, 1, 1, 1],
      [ 9, 9, 9, 9,10,10, 9, 9, 3, 9, 9, 9, 9, 9, 9, 3, 9, 3,20, 1],
      [10, 0,10, 9, 9, 9, 9, 3, 9, 9, 9, 9, 3, 9, 9, 9, 9, 9, 3,20],
      [20,20,20,10, 9, 9, 9, 9, 9, 9, 9,26, 0,20, 9, 9, 9, 9, 9, 3],
      [10, 0,10, 9, 9, 9,11, 9,11, 9, 9,10,24,10, 9, 9, 9, 9, 9, 9],
      [ 9,10, 9, 9,11,11,11, 9, 9, 9, 9,10, 0,10, 9, 9, 9, 9, 9, 9],
      [ 9, 9, 9, 9, 9,13,11,11, 9, 9,13, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [ 9, 9, 9,13, 9, 9, 9,11,11, 9, 9, 9, 9, 9, 9, 9, 9,10,24,26],
      [ 9, 9, 9, 9, 9,11, 9,10, 9,11, 9, 3, 9, 9, 9, 9,10,20, 0,24],
      [ 9, 3, 9, 9,11, 9,10,20,10, 9, 9, 9, 9, 9, 9,10, 0,20,20,20],
      [ 9, 9, 9,11,11,10,20,24,20,10,11, 9, 9, 9,10,20,20, 0,20,19],
    ],
    "owners": [
      {"location": {"x": 18, "y": 10}, "player": 0},
      {"location": {"x": 19, "y": 10}, "player": 0},
      {"location": {"x": 17, "y": 11}, "player": 0},
      {"location": {"x": 19, "y": 11}, "player": 0},
      {"location": {"x": 17, "y": 12}, "player": 0},
      {"location": {"x": 18, "y": 12}, "player": 0},
      {"location": {"x": 19, "y": 12}, "player": 0},
      {"location": {"x": 15, "y": 13}, "player": 0},
      {"location": {"x": 16, "y": 13}, "player": 0},
      {"location": {"x": 18, "y": 13}, "player": 0},
      {"location": {"x": 19, "y": 13}, "player": 0},
      {"location": {"x": 11, "y":  0}, "player": 1},
      {"location": {"x": 15, "y":  0}, "player": 1},
      {"location": {"x": 19, "y":  0}, "player": 1},
      {"location": {"x":  9, "y":  1}, "player": 1},
      {"location": {"x":  9, "y":  2}, "player": 1},
      {"location": {"x": 12, "y":  2}, "player": 1},
      {"location": {"x":  7, "y":  3}, "player": 1},
      {"location": {"x": 18, "y":  4}, "player": 1},
      {"location": {"x": 19, "y":  5}, "player": 1},
    ],
    "tileData": [
    ],
    "predeploy": [
      {"location": {"x": 18, "y": 13}, "serial": 13, "player": 0},
      {"location": {"x": 16, "y": 13}, "serial":  0, "player": 0},
      {"location": {"x": 14, "y": 13}, "serial": 27, "player": 0},
      {"location": {"x": 15, "y": 12}, "serial": 26, "player": 0},
      {"location": {"x": 17, "y": 12}, "serial":  0, "player": 0},
      {"location": {"x": 15, "y": 11}, "serial": 23, "player": 0},
      {"location": {"x": 17, "y": 10}, "serial": 27, "player": 0},
      {"location": {"x": 16, "y":  9}, "serial": 25, "player": 0},
      {"location": {"x": 18, "y":  9}, "serial": 22, "player": 0},
      {"location": {"x": 17, "y":  8}, "serial": 24, "player": 0},
      {"location": {"x":  1, "y":  1}, "serial": 23, "player": 1},
      {"location": {"x":  4, "y":  1}, "serial": 27, "player": 1},
      {"location": {"x":  6, "y":  1}, "serial": 26, "player": 1},
      {"location": {"x":  8, "y":  0}, "serial":  0, "player": 1},
      {"location": {"x": 12, "y":  1}, "serial":  6, "player": 1},
      {"location": {"x": 17, "y":  0}, "serial":  7, "player": 1},
      {"location": {"x": 19, "y":  0}, "serial": 12, "player": 1},
      {"location": {"x":  7, "y":  2}, "serial": 22, "player": 1},
      {"location": {"x": 19, "y":  2}, "serial":  5, "player": 1},
      {"location": {"x":  7, "y":  3}, "serial":  1, "player": 1},
      {"location": {"x": 10, "y":  3}, "serial":  9, "player": 1},
      {"location": {"x": 14, "y":  3}, "serial": 27, "player": 1},
      {"location": {"x": 18, "y":  4}, "serial": 12, "player": 1},
      {"location": {"x":  3, "y": 11}, "serial": 22, "player": 1},
      {"location": {"x":  4, "y":  8}, "serial": 27, "player": 2},
      {"location": {"x":  6, "y": 10}, "serial": 27, "player": 2},
      {"location": {"x": 12, "y":  6}, "serial": 13, "player": 2},
    ],
  },
  {
    "name": "C15: Icy Retreat",
    "size": { "width": 24, "height": 10 },
    "players": 3,
    "map": [
      [ 3, 3, 3, 3, 3, 4, 8, 3, 3, 2, 2, 2, 4, 3, 9, 3, 3, 0, 9, 9, 3,20, 4,20],
      [ 3, 3,20, 3, 4,15, 8, 3, 3, 3,20,20, 3, 9, 9, 9, 9, 9, 9,15, 9, 3,20, 3],
      [ 1, 4, 4, 0, 0, 4, 8,15, 1, 1, 4, 1, 1, 6, 6, 9,15, 9, 9, 9, 9, 9, 5, 0],
      [ 4,15,20, 2, 4,20, 8,16,20, 0, 0,20, 9, 9, 6, 6, 6, 6, 6, 6, 6, 6,20,24],
      [20,16, 0, 9, 0, 8, 8,16, 0, 0, 9, 9, 9,11,11, 6, 9,11, 9,11, 6, 9, 9,24],
      [ 4,16, 4, 1, 1, 6, 1,16, 1, 1, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,20,24],
      [ 0,16, 2, 2, 8, 8, 2,16, 5,20, 9, 6,11, 9,11,11, 9, 6,11, 9, 9, 9, 0, 0],
      [20,16, 0, 0, 8, 0, 0,15, 0, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0, 0, 4],
      [ 4,16, 2, 3, 8, 3, 3, 0, 2, 2, 9, 6, 9, 9, 9, 9, 9, 9, 9, 5, 0, 0,20, 4],
      [ 3,15, 0,20, 8, 2, 3,20,20, 9, 9,20, 9,11, 9,20,20, 0, 0, 2, 0,20, 4,20],
    ],
    "owners": [
      {"location": {"x": 10, "y":  1}, "player": 0},
      {"location": {"x": 11, "y":  1}, "player": 0},
      {"location": {"x":  8, "y":  3}, "player": 0},
      {"location": {"x": 11, "y":  3}, "player": 0},
      {"location": {"x":  9, "y":  6}, "player": 0},
      {"location": {"x":  0, "y":  7}, "player": 0},
      {"location": {"x":  7, "y":  9}, "player": 0},
      {"location": {"x":  8, "y":  9}, "player": 0},
      {"location": {"x":  0, "y":  4}, "player": 1},
      {"location": {"x": 23, "y":  0}, "player": 2},
      {"location": {"x": 22, "y":  1}, "player": 2},
      {"location": {"x": 22, "y":  3}, "player": 2},
      {"location": {"x": 23, "y":  3}, "player": 2},
      {"location": {"x": 23, "y":  4}, "player": 2},
      {"location": {"x": 22, "y":  5}, "player": 2},
      {"location": {"x": 23, "y":  5}, "player": 2},
      {"location": {"x": 22, "y":  8}, "player": 2},
      {"location": {"x": 23, "y":  9}, "player": 2},
    ],
    "predeploy": [
      {"location": {"x": 13, "y":  5}, "serial":  0, "player": 0},
      {"location": {"x": 15, "y":  5}, "serial":  9, "player": 0},
      {"location": {"x": 15, "y":  7}, "serial":  6, "player": 0},
      {"location": {"x": 17, "y":  7}, "serial": 13, "player": 0},
      {"location": {"x": 19, "y":  7}, "serial":  1, "player": 0},
      {"location": {"x": 20, "y":  5}, "serial":  5, "player": 0},
      {"location": {"x": 17, "y":  3}, "serial":  5, "player": 0},
      {"location": {"x": 17, "y":  5}, "serial":  7, "player": 0},
      {"location": {"x": 15, "y":  3}, "serial":  0, "player": 1},
      {"location": {"x": 19, "y":  5}, "serial":  3, "player": 1},
      {"location": {"x": 23, "y":  6}, "serial":  8, "player": 2},
      {"location": {"x": 23, "y":  4}, "serial":  8, "player": 2},
      {"location": {"x": 23, "y":  2}, "serial":  8, "player": 2},
      {"location": {"x": 22, "y":  1}, "serial":  6, "player": 2},
      {"location": {"x": 23, "y":  0}, "serial": 19, "player": 2},
      {"location": {"x": 23, "y":  9}, "serial":  6, "player": 2},
      {"location": {"x": 20, "y":  3}, "serial":  2, "player": 2},
      {"location": {"x": 16, "y":  4}, "serial": 19, "player": 2},
      {"location": {"x": 11, "y":  9}, "serial": 11, "player": 2},
      {"location": {"x":  6, "y":  5}, "serial":  9, "player": 2},
      {"location": {"x":  2, "y":  2}, "serial":  3, "player": 2},
      {"location": {"x":  3, "y":  9}, "serial":  3, "player": 2},
      {"location": {"x":  5, "y":  8}, "serial":  0, "player": 2},
      {"location": {"x":  9, "y":  1}, "serial":  1, "player": 2},
    ],
    "tileData": [
      {"location": {"x":  1, "y": 3}, "data": {"landTile":true,"hp":99}},
      {"location": {"x":  1, "y": 4}, "data": {"landTile":true}},
      {"location": {"x":  1, "y": 5}, "data": {"landTile":true}},
      {"location": {"x":  1, "y": 6}, "data": {"landTile":true}},
      {"location": {"x":  1, "y": 7}, "data": {"landTile":true}},
      {"location": {"x":  1, "y": 8}, "data": {"landTile":true}},
      {"location": {"x":  1, "y": 9}, "data": {"landTile":true,"hp":99}},
      {"location": {"x":  5, "y": 1}, "data": {"landTile":true,"hp":99}},
      {"location": {"x":  5, "y": 5}, "data": {"landTile":true}},
      {"location": {"x":  7, "y": 2}, "data": {"landTile":true,"hp":99}},
      {"location": {"x":  7, "y": 3}, "data": {"landTile":true}},
      {"location": {"x":  7, "y": 4}, "data": {"landTile":true}},
      {"location": {"x":  7, "y": 5}, "data": {"landTile":true}},
      {"location": {"x":  7, "y": 6}, "data": {"landTile":true}},
      {"location": {"x":  7, "y": 7}, "data": {"landTile":true,"hp":99}},
      {"location": {"x": 10, "y": 5}, "data": {"landTile":false}},
      {"location": {"x": 10, "y": 7}, "data": {"landTile":false}},
      {"location": {"x": 11, "y": 5}, "data": {"landTile":false}},
      {"location": {"x": 11, "y": 6}, "data": {"landTile":false}},
      {"location": {"x": 11, "y": 7}, "data": {"landTile":false}},
      {"location": {"x": 11, "y": 8}, "data": {"landTile":false}},
      {"location": {"x": 12, "y": 5}, "data": {"landTile":false}},
      {"location": {"x": 12, "y": 7}, "data": {"landTile":false}},
      {"location": {"x": 13, "y": 2}, "data": {"landTile":false}},
      {"location": {"x": 13, "y": 5}, "data": {"landTile":false}},
      {"location": {"x": 13, "y": 7}, "data": {"landTile":false}},
      {"location": {"x": 14, "y": 2}, "data": {"landTile":false}},
      {"location": {"x": 14, "y": 3}, "data": {"landTile":false}},
      {"location": {"x": 14, "y": 5}, "data": {"landTile":false}},
      {"location": {"x": 14, "y": 7}, "data": {"landTile":false}},
      {"location": {"x": 15, "y": 3}, "data": {"landTile":false}},
      {"location": {"x": 15, "y": 4}, "data": {"landTile":false}},
      {"location": {"x": 15, "y": 5}, "data": {"landTile":false}},
      {"location": {"x": 15, "y": 7}, "data": {"landTile":false}},
      {"location": {"x": 16, "y": 2}, "data": {"landTile":false,"hp":99}},
      {"location": {"x": 16, "y": 3}, "data": {"landTile":false}},
      {"location": {"x": 16, "y": 5}, "data": {"landTile":false}},
      {"location": {"x": 16, "y": 7}, "data": {"landTile":false}},
      {"location": {"x": 17, "y": 3}, "data": {"landTile":false}},
      {"location": {"x": 17, "y": 5}, "data": {"landTile":false}},
      {"location": {"x": 17, "y": 6}, "data": {"landTile":false}},
      {"location": {"x": 17, "y": 7}, "data": {"landTile":false}},
      {"location": {"x": 18, "y": 3}, "data": {"landTile":false}},
      {"location": {"x": 18, "y": 5}, "data": {"landTile":false}},
      {"location": {"x": 18, "y": 7}, "data": {"landTile":false}},
      {"location": {"x": 19, "y": 1}, "data": {"landTile":false,"hp":99}},
      {"location": {"x": 19, "y": 3}, "data": {"landTile":false}},
      {"location": {"x": 19, "y": 5}, "data": {"landTile":false}},
      {"location": {"x": 19, "y": 7}, "data": {"landTile":false}},
      {"location": {"x": 20, "y": 3}, "data": {"landTile":false}},
      {"location": {"x": 20, "y": 4}, "data": {"landTile":false}},
      {"location": {"x": 20, "y": 5}, "data": {"landTile":false}},
      {"location": {"x": 21, "y": 3}, "data": {"landTile":false}},
      {"location": {"x": 21, "y": 5}, "data": {"landTile":false}},
    ],
  },
  {
    "name": "C20: Waylon Flies Again",
    "size": { "width": 22, "height": 13 },
    "players": 3,
    "map": [
      [ 0, 0, 0, 0, 4, 0, 0, 4, 4, 5,20, 4, 0, 0, 2, 0, 0, 4, 0, 2, 0, 4],
      [ 4,20,20, 3, 0, 0, 3, 3, 3, 4, 4, 0, 0, 3, 0, 2, 0, 2, 0,20,20, 0],
      [ 0, 4, 0, 0, 3, 4, 0, 5, 3, 3, 3, 4, 3, 3, 3, 0,20, 0, 1, 1, 1, 1],
      [25, 0, 0, 2, 0, 4, 0, 3, 3, 3, 0, 4, 0, 3, 3, 0, 0, 2, 1, 5,20, 0],
      [ 0,20, 4,20, 4, 0,24, 0, 3, 0,20, 1,20, 0, 3, 3, 0, 4, 1, 0, 0,25],
      [19, 0,20, 4, 0, 0, 0, 3, 3, 0, 2, 1, 0, 2, 4, 3, 0, 0, 1, 0,24, 0],
      [ 0,20, 0,20, 3, 0, 4, 3, 2, 0, 4, 1, 4, 0, 4, 3,20, 0, 4, 1, 1,19],
      [19, 0,20, 0, 0, 4,25, 3, 3, 4,20, 1,20, 0, 4, 4, 1, 1, 4, 4,24, 0],
      [ 0,20, 2,24, 3, 0, 3, 3, 3, 4, 4, 1, 0, 2, 3, 4, 4, 0, 1, 0, 0,25],
      [25, 0, 0, 1, 3, 0,20, 3, 3, 3, 2, 1, 0, 3, 3, 0, 0, 0, 1, 0, 0, 0],
      [ 0, 0, 4, 1, 2, 0, 0, 3, 3, 0, 3, 1, 3, 3, 3, 0, 4,20, 1,20,20, 0],
      [ 0,20,20, 1, 3, 0, 3,20, 3,20, 2, 1, 0, 3, 0, 4, 0, 0, 1, 1, 1, 1],
      [ 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,20, 2, 4, 0, 2, 0, 0,20, 5, 0],
    ],
    "owners": [
      {"location": {"x":  1, "y":  4}, "player": 0},
      {"location": {"x": 10, "y":  4}, "player": 0},
      {"location": {"x": 12, "y":  4}, "player": 0},
      {"location": {"x":  0, "y":  5}, "player": 0},
      {"location": {"x":  2, "y":  5}, "player": 0},
      {"location": {"x":  1, "y":  6}, "player": 0},
      {"location": {"x": 10, "y":  7}, "player": 0},
      {"location": {"x": 12, "y":  7}, "player": 0},
      {"location": {"x":  0, "y":  7}, "player": 1},
      {"location": {"x":  2, "y":  7}, "player": 1},
      {"location": {"x":  1, "y":  8}, "player": 1},
      {"location": {"x": 19, "y":  1}, "player": 2},
      {"location": {"x": 20, "y":  1}, "player": 2},
      {"location": {"x": 20, "y":  3}, "player": 2},
      {"location": {"x": 21, "y":  4}, "player": 2},
      {"location": {"x": 20, "y":  5}, "player": 2},
      {"location": {"x": 21, "y":  6}, "player": 2},
      {"location": {"x": 20, "y":  7}, "player": 2},
      {"location": {"x": 21, "y":  8}, "player": 2},
      {"location": {"x": 19, "y": 10}, "player": 2},
      {"location": {"x": 20, "y": 10}, "player": 2},
      {"location": {"x": 19, "y": 12}, "player": 2},
    ],
    "tileData": [
    ],
    "predeploy": [
      {"location": {"x":  8, "y":  4}, "serial":  0, "player": 0},
      {"location": {"x": 10, "y":  4}, "serial":  0, "player": 0},
      {"location": {"x": 10, "y":  7}, "serial":  1, "player": 0},
      {"location": {"x":  8, "y":  7}, "serial":  1, "player": 0},
      {"location": {"x": 11, "y":  6}, "serial":  2, "player": 0},
      {"location": {"x": 11, "y":  5}, "serial":  5, "player": 0},
      {"location": {"x":  0, "y":  7}, "serial": 12, "player": 1},
      {"location": {"x":  2, "y":  8}, "serial":  5, "player": 1},
      {"location": {"x":  3, "y":  6}, "serial": 12, "player": 1},
      {"location": {"x":  2, "y":  4}, "serial":  5, "player": 1},
      {"location": {"x":  5, "y":  4}, "serial":  6, "player": 1},
      {"location": {"x":  5, "y":  8}, "serial":  6, "player": 1},
      {"location": {"x": 20, "y":  2}, "serial": 17, "player": 2},
      {"location": {"x": 21, "y":  3}, "serial": 19, "player": 2},
      {"location": {"x": 19, "y":  4}, "serial": 14, "player": 2},
      {"location": {"x": 20, "y":  6}, "serial": 15, "player": 2},
      {"location": {"x": 18, "y":  6}, "serial": 14, "player": 2},
      {"location": {"x": 19, "y":  8}, "serial": 14, "player": 2},
      {"location": {"x": 21, "y":  9}, "serial": 19, "player": 2},
      {"location": {"x": 20, "y": 10}, "serial": 17, "player": 2},
      {"location": {"x": 15, "y":  6}, "serial": 19, "player": 2},
    ],
  },
  {
    "name": "C21: Lin's Gambit",
    "size": { "width": 20, "height": 20 },
    "players": 2,
    "map": [
      [ 1, 1, 2, 3, 0, 0, 2, 2, 3, 3, 1, 1, 1, 1, 1, 1, 1, 3, 3, 1],
      [19, 1,20,20,24,20,20, 0, 0, 0, 1,20, 2,24, 2,20, 1, 0, 2, 1],
      [ 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [ 0, 1,26, 9, 9, 9,26, 0, 1, 0,10,10,10,10,10,10,20, 1, 2, 1],
      [20, 1, 9, 9, 9, 9, 9, 5, 1, 1, 6, 6, 6, 6, 6, 6, 1, 1, 0, 1],
      [ 1, 1, 6, 9, 9, 9, 6, 1, 1, 3, 9, 9, 9, 9, 9, 9, 5, 1, 5, 1],
      [ 9, 9, 9, 9, 9, 9, 9,10,10, 9, 9,11,11,11, 9, 9, 9, 6, 9, 6],
      [ 9,11,11, 9, 9, 9,11,11,11,11,11,11,11,11,11, 9, 9, 6, 9, 6],
      [ 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9,10,10,10, 9,11,11, 6,11, 6],
      [10,10,10,10,10,10,10, 9,11,11, 9, 2,20,24,10, 9, 9, 6, 9, 6],
      [ 1, 1, 1, 1, 1, 1, 1,10,11, 9, 9,26, 0, 1,10, 9, 9, 6, 9, 1],
      [ 1, 2,24, 5,26, 2, 1,10, 9, 9, 9, 9, 9, 6, 9,11,10, 1, 2, 1],
      [ 6, 9, 9, 9, 9, 9, 6, 9,11,11,11,11, 9, 6, 9,11,10, 1, 1, 1],
      [ 6, 9,11,11,11, 9, 9, 9, 9, 9, 9, 9, 9, 6, 9, 9, 9,26, 1,24],
      [ 6, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9,11,11, 6, 9, 9, 9, 9, 1, 0],
      [ 6,11,11,11,11, 9, 9, 9,11,11,11, 9, 9, 6, 9, 9, 9,10, 1,20],
      [ 6, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 1, 3, 3, 2,20, 1, 1],
      [ 6,10,10,10,10,10, 6,10,24,20,10,10,20, 1, 0, 0, 0, 0, 1, 0],
      [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [ 3, 2, 5, 0, 1,20, 1, 2, 3,20, 0,20, 2, 3, 0,20, 0,19, 1, 3],
    ],
    "owners": [
      {"location": {"x": 17, "y": 13}, "player": 0},
      {"location": {"x": 19, "y": 13}, "player": 0},
      {"location": {"x": 19, "y": 15}, "player": 0},
      {"location": {"x": 17, "y": 16}, "player": 0},
      {"location": {"x":  8, "y": 17}, "player": 0},
      {"location": {"x":  9, "y": 17}, "player": 0},
      {"location": {"x": 12, "y": 17}, "player": 0},
      {"location": {"x": 17, "y": 19}, "player": 0},
      {"location": {"x":  0, "y":  1}, "player": 1},
      {"location": {"x":  2, "y":  1}, "player": 1},
      {"location": {"x":  3, "y":  1}, "player": 1},
      {"location": {"x":  4, "y":  1}, "player": 1},
      {"location": {"x":  5, "y":  1}, "player": 1},
      {"location": {"x":  6, "y":  1}, "player": 1},
      {"location": {"x": 11, "y":  1}, "player": 1},
      {"location": {"x": 13, "y":  1}, "player": 1},
      {"location": {"x": 15, "y":  1}, "player": 1},
      {"location": {"x":  2, "y":  3}, "player": 1},
      {"location": {"x":  6, "y":  3}, "player": 1},
      {"location": {"x":  0, "y":  4}, "player": 1},
    ],
    "tileData": [
    ],
    "predeploy": [
      {"location": {"x":  5, "y": 18}, "serial":  0, "player": 0},
      {"location": {"x":  9, "y": 18}, "serial":  0, "player": 0},
      {"location": {"x": 17, "y": 18}, "serial":  0, "player": 0},
      {"location": {"x": 17, "y": 11}, "serial":  1, "player": 0},
      {"location": {"x": 16, "y": 11}, "serial": 26, "player": 0},
      {"location": {"x": 19, "y": 11}, "serial": 11, "player": 0},
      {"location": {"x": 18, "y": 12}, "serial":  4, "player": 0},
      {"location": {"x": 18, "y": 14}, "serial": 11, "player": 0},
      {"location": {"x": 19, "y": 16}, "serial":  8, "player": 0},
      {"location": {"x": 17, "y": 16}, "serial": 13, "player": 0},
      {"location": {"x": 15, "y": 15}, "serial": 25, "player": 0},
      {"location": {"x": 16, "y": 13}, "serial": 24, "player": 0},
      {"location": {"x": 12, "y": 18}, "serial": 10, "player": 0},
      {"location": {"x": 13, "y": 17}, "serial":  2, "player": 0},
      {"location": {"x": 11, "y": 16}, "serial": 24, "player": 0},
      {"location": {"x":  7, "y": 17}, "serial": 27, "player": 0},
      {"location": {"x":  5, "y": 15}, "serial": 25, "player": 0},
      {"location": {"x":  2, "y": 14}, "serial": 25, "player": 0},
      {"location": {"x":  3, "y": 16}, "serial": 22, "player": 0},
      {"location": {"x":  2, "y": 18}, "serial": 13, "player": 0},
      {"location": {"x":  0, "y": 18}, "serial":  6, "player": 0},
      {"location": {"x":  2, "y":  4}, "serial": 22, "player": 1},
      {"location": {"x":  3, "y":  3}, "serial": 22, "player": 1},
      {"location": {"x":  5, "y":  3}, "serial": 22, "player": 1},
      {"location": {"x":  6, "y":  4}, "serial": 22, "player": 1},
      {"location": {"x":  3, "y":  5}, "serial": 23, "player": 1},
      {"location": {"x":  5, "y":  5}, "serial": 23, "player": 1},
      {"location": {"x":  7, "y":  6}, "serial": 27, "player": 1},
      {"location": {"x":  1, "y":  6}, "serial": 27, "player": 1},
      {"location": {"x": 14, "y":  3}, "serial": 26, "player": 1},
      {"location": {"x": 11, "y":  3}, "serial": 26, "player": 1},
      {"location": {"x": 18, "y":  1}, "serial": 11, "player": 1},
      {"location": {"x":  7, "y":  0}, "serial": 11, "player": 1},
      {"location": {"x":  2, "y":  0}, "serial": 11, "player": 1},
      {"location": {"x":  6, "y":  1}, "serial": 11, "player": 1},
      {"location": {"x": 16, "y":  5}, "serial":  1, "player": 1},
      {"location": {"x": 18, "y":  3}, "serial":  1, "player": 1},
      {"location": {"x":  8, "y":  4}, "serial":  1, "player": 1},
      {"location": {"x":  0, "y":  1}, "serial":  8, "player": 1},
      {"location": {"x": 14, "y":  1}, "serial":  7, "player": 1},
      {"location": {"x": 19, "y":  2}, "serial":  6, "player": 1},
      {"location": {"x": 18, "y":  5}, "serial": 10, "player": 1},
    ],
  },
  {
    "name": "C23: Sacrificial Lamb",
    "size": { "width": 22, "height": 18 },
    "players": 2,
    "map": [
      [ 3,23, 3,15, 9, 9,11,11, 9, 9,12, 9, 9,26, 0, 3, 3, 1, 0, 0, 2, 3],
      [ 3,23,23,16, 9, 9,11, 9, 9, 9, 9, 9, 9, 9, 4,24, 1, 1,19,21, 1, 1],
      [15,16,16,15, 9, 9, 9, 9, 9, 3, 3, 8,10,10, 0, 1,20, 1, 1, 1, 1, 3],
      [ 3, 0, 0,10, 9, 9, 9, 9, 3, 2, 0, 8,15, 1, 1, 1, 0, 5, 0, 1,24, 2],
      [ 2,20,10, 9, 9,12, 9, 2, 0, 1, 1, 1, 8, 8,15, 8, 8, 1, 1, 1, 0, 3],
      [20,10, 9, 9,12, 9, 9, 0,20, 1,21, 1, 1, 1, 4, 0, 8, 0,10,10,26, 3],
      [ 9, 9, 9,12, 9, 9, 9,10, 0, 1, 1, 1,20, 1, 1, 1, 8, 0, 9, 9, 9, 9],
      [ 9, 9,12, 9, 9, 9, 9, 9, 9, 0,20, 1, 1, 1, 0,20, 8, 8, 8, 9,12, 9],
      [11, 9, 9, 9,11,11, 9, 9, 9,10, 0, 5, 1,24, 0, 0, 4, 0, 0, 9, 9, 9],
      [ 9, 9, 9, 9, 9, 9,11, 9, 9, 9, 0, 0, 1, 1, 5, 0, 0,20,20,10,12, 9],
      [20, 0,26, 9, 9, 9, 9,11, 9, 9, 9, 0,20, 1, 1, 1,20, 1, 0,10,12, 9],
      [ 3,20, 0, 0,10,10, 9, 9,11, 9, 9,10, 0, 0, 0, 1, 1, 1, 9, 9, 9, 9],
      [ 0,24,20, 0,20, 0,10, 9, 9,11, 9, 9, 9, 9, 0, 0,20, 9, 9, 9,12, 9],
      [ 3, 0, 0, 0, 0,20, 0,10, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [ 2, 0, 0, 0,20, 0,20, 0,10, 9, 9,11, 9, 9, 9, 9,11,11, 9,10, 0, 4],
      [20, 0,19, 0, 0, 0, 0, 0, 0,10, 9, 9,11, 9, 9,11, 9, 9,10, 0, 0,20],
      [ 3, 4, 0, 0, 0,20,20,24, 0,26, 9, 9, 9, 9, 9, 9,10,10, 0,20, 3,23],
      [ 3, 3,20,20, 3,20, 0, 3,20, 0, 9, 9,12, 9, 9,10, 0, 4, 5, 3,23,23],
    ],
    "owners": [
      {"location": {"x":  0, "y": 10}, "player": 0},
      {"location": {"x":  2, "y": 10}, "player": 0},
      {"location": {"x":  1, "y": 11}, "player": 0},
      {"location": {"x":  1, "y": 12}, "player": 0},
      {"location": {"x":  2, "y": 12}, "player": 0},
      {"location": {"x":  4, "y": 12}, "player": 0},
      {"location": {"x":  5, "y": 13}, "player": 0},
      {"location": {"x":  4, "y": 14}, "player": 0},
      {"location": {"x":  6, "y": 14}, "player": 0},
      {"location": {"x":  0, "y": 15}, "player": 0},
      {"location": {"x":  2, "y": 15}, "player": 0},
      {"location": {"x":  5, "y": 16}, "player": 0},
      {"location": {"x":  6, "y": 16}, "player": 0},
      {"location": {"x":  7, "y": 16}, "player": 0},
      {"location": {"x":  9, "y": 16}, "player": 0},
      {"location": {"x":  2, "y": 17}, "player": 0},
      {"location": {"x":  3, "y": 17}, "player": 0},
      {"location": {"x":  5, "y": 17}, "player": 0},
      {"location": {"x":  8, "y": 17}, "player": 0},
      {"location": {"x": 13, "y":  0}, "player": 1},
      {"location": {"x": 15, "y":  1}, "player": 1},
      {"location": {"x": 18, "y":  1}, "player": 1},
      {"location": {"x": 19, "y":  1}, "player": 1},
      {"location": {"x": 16, "y":  2}, "player": 1},
      {"location": {"x": 20, "y":  3}, "player": 1},
      {"location": {"x": 10, "y":  5}, "player": 1},
      {"location": {"x": 20, "y":  5}, "player": 1},
      {"location": {"x": 12, "y":  6}, "player": 1},
      {"location": {"x": 15, "y":  7}, "player": 1},
      {"location": {"x": 18, "y":  9}, "player": 1},
      {"location": {"x": 16, "y": 10}, "player": 1},
    ],
    "tileData": [
    ],
    "predeploy": [
      {"location": {"x":  1, "y": 14}, "serial":  0, "player": 0},
      {"location": {"x":  3, "y": 14}, "serial":  0, "player": 0},
      {"location": {"x":  3, "y": 16}, "serial":  0, "player": 0},
      {"location": {"x":  5, "y": 15}, "serial":  8, "player": 0},
      {"location": {"x":  2, "y": 13}, "serial":  8, "player": 0},
      {"location": {"x":  1, "y":  9}, "serial": 22, "player": 0},
      {"location": {"x":  3, "y": 10}, "serial": 22, "player": 0},
      {"location": {"x":  5, "y": 10}, "serial": 25, "player": 0},
      {"location": {"x":  6, "y": 11}, "serial": 25, "player": 0},
      {"location": {"x":  8, "y": 13}, "serial": 25, "player": 0},
      {"location": {"x": 10, "y": 14}, "serial": 26, "player": 0},
      {"location": {"x": 11, "y": 17}, "serial": 26, "player": 0},
      {"location": {"x":  8, "y": 11}, "serial": 26, "player": 0},
      {"location": {"x":  3, "y":  8}, "serial": 26, "player": 0},
      {"location": {"x": 16, "y":  3}, "serial":  1, "player": 1},
      {"location": {"x": 18, "y":  3}, "serial":  1, "player": 1},
      {"location": {"x": 18, "y":  2}, "serial": 11, "player": 1},
      {"location": {"x": 17, "y":  1}, "serial": 11, "player": 1},
      {"location": {"x": 15, "y":  1}, "serial":  1, "player": 1},
      {"location": {"x": 18, "y":  5}, "serial": 26, "player": 1},
      {"location": {"x": 20, "y":  7}, "serial": 25, "player": 1},
      {"location": {"x": 10, "y":  0}, "serial": 25, "player": 1},
      {"location": {"x": 20, "y": 12}, "serial": 27, "player": 1},
      {"location": {"x": 14, "y": 11}, "serial":  6, "player": 1},
      {"location": {"x": 17, "y":  9}, "serial": 11, "player": 1},
      {"location": {"x": 14, "y":  9}, "serial":  9, "player": 1},
      {"location": {"x": 11, "y":  8}, "serial": 10, "player": 1},
      {"location": {"x": 11, "y":  6}, "serial": 11, "player": 1},
      {"location": {"x":  9, "y":  4}, "serial": 11, "player": 1},
      {"location": {"x":  9, "y":  6}, "serial":  6, "player": 1},
      {"location": {"x":  3, "y":  6}, "serial": 27, "player": 1},
      {"location": {"x": 11, "y":  4}, "serial":  5, "player": 1},
    ],
  },
];