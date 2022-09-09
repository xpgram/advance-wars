import { CardinalDirection, SumCardinalsToVector } from "../../Common/CardinalDirection";
import { Point } from "../../Common/Point";
import { Instruction } from "../EnumTypes";
import { Square } from "../map/Square";
import { TerrainObject } from "../map/TerrainObject";
import { UnitObject } from "../UnitObject";
import { BattleSceneControllers } from "./BattleSceneControllers";

export class InstructionDataError extends Error {
  name = 'InstructionDataError';
}

/** Asserts data exists and returns it.
 * @throws InstructionDataError if data is undefined. */
function get<T>(data: T | undefined, description: string): T {
  if (data === undefined)
    throw new InstructionDataError(`missing data: ${description}`);
  return data;
}

// TODO Once the container filling is done and the event scheduling
// begins, filling shouldn't be possible anymore.
// I don't think I can get the TypeScript linter to complain, but
// I can get an error thrown if I try to modify shit mid-ratification.
//
// So, instructionData.freeze() sets a private boolean, all setters
// (set actor(), set place(), etc.) should throw an error until
// instructionData.reset() is called.

export module instructionData {

  /** Container which holds commonly requested field information and object
   * references, if they are acquirable. */
  let dump: {
    assets?: BattleSceneControllers,
    seed?: number,
    action?: Instruction,
    which?: number,

    place?: Point,
    placeTile?: Square,
    placeTerrain?: TerrainObject,
    actor?: UnitObject,

    path?: CardinalDirection[],
    goal?: Point,
    goalTile?: Square,
    goalTerrain?: TerrainObject,
    underneath?: UnitObject,

    drop?: {which: number, where: Point}[],

    focal?: Point,
    focalTile?: Square,
    focalTerrain?: TerrainObject,
    target?: UnitObject,
  } = { };

  /** Sets data to the instruction object. */
  function setData<T>(value: T, key: string) {
    const { assets } = dump;
    if (!assets)
      throw new InstructionDataError(`can't set instruction values before first fill()`);
    const { instruction } = assets;

    //@ts-expect-error
    instruction[key] = value;
  }

  /** Updates the data-access system with new instruction data.
   * Must be called before attempting to access any data. */
  export function fill(assets: BattleSceneControllers): void {
    // Reset
    dump = {};

    const d = dump;

    const { instruction, map } = assets;
    const { seed, action, which, place, path, drop, focal } = instruction;

    // Essential
    d.assets = assets;
    d.seed = seed;
    d.action = action;
    d.which = which;
    d.place = new Point(place);
    d.path = path;
    d.drop = drop;
    d.drop.forEach( ins => ins.where = new Point(ins.where) );
    d.focal = new Point(focal);

    // Inferables
    if (d.place) {
      d.placeTile = map.squareAt(d.place);
      d.placeTerrain = d.placeTile.terrain;
      d.actor = d.placeTile.unit;
      (!d.path) && (d.path = []);
      d.goal = SumCardinalsToVector(d.path).add(d.place)
      d.goalTile = map.squareAt(d.goal);
      d.goalTerrain = d.goalTile.terrain;
      d.underneath = d.goalTile.unit;
    }
    if (d.focal) {
        d.focalTile = map.squareAt(d.focal);
        d.focalTerrain = d.focalTile.terrain;
        d.target = d.focalTile.unit;
    }
  }

  /** Access to getters for commonly requested field information and object references.
   * @throws InstructionDataError if requested information does not exist. */
  export const data = {
    set seed(n: number)   { setData(n, 'seed'  ) },
    set action(n: number) { setData(n, 'action') },
    set which(n: number)  { setData(n, 'which' ) },
    set place(p: Point)   { setData(p, 'place' ) },
    set focal(p: Point)   { setData(p, 'focal' ) },
    set path(p: CardinalDirection[])              { setData(p, 'path') },
    set drop(l: {which: number, where: Point}[])  { setData(l, 'drop') },

    get assets()       { return get(dump.assets,       `scene assets`                 ) },
    
    get seed()         { return get(dump.seed,         `psuedo-random seed`           ) },
    get action()       { return get(dump.action,       `command serial`               ) },
    get which()        { return get(dump.which,        `command serial variant`       ) },

    get place()        { return get(dump.place,        `source location`              ) },
    get placeTile()    { return get(dump.placeTile,    `tile at source location`      ) },
    get placeTerrain() { return get(dump.placeTerrain, `terrain at source location`   ) },
    get actor()        { return get(dump.actor,        `actor object`                 ) },

    get path()         { return get(dump.path,         `movement path`                ) },
    get goal()         { return get(dump.goal,         `movement terminal`            ) },
    get goalTile()     { return get(dump.goalTile,     `tile at movement terminal`    ) },
    get goalTerrain()  { return get(dump.goalTerrain,  `terrain at movement terminal` ) },
    get underneath()   { return get(dump.underneath,   `object at movement terminal`  ) },

    get drop()         { return get(dump.drop,         `list of held units to drop`   ) },

    get focal()        { return get(dump.focal,        `target location`              ) },
    get focalTile()    { return get(dump.focalTile,    `tile at target location`      ) },
    get focalTerrain() { return get(dump.focalTerrain, `terrain at target location`   ) },
    get target()       { return get(dump.target,       `target object`                ) },

    // Common questions
    get plansToMove()     { return this.place.notEqual(this.goal) },
  }

}