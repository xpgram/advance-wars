import { Point } from "../../Common/Point";
import { NeighborMatrix } from "../../NeighborMatrix";
import { Common } from "../../CommonUtils";
import { Debug } from "../../DebugUtils";
import { StringDictionary } from "../../CommonTypes";

/** A boolean map projected onto an infinite euclidean plane.
 * 
 * @param map A 2D boolean array describing the range as member (true) and non-member (false).
 * @param origin The center of the described shape. This point would normally be the actor's
 * position or the attack's target point.
 * 
 * @author Dei Valko
 */
export class RegionMap {
    private readonly _map: boolean[][];
    private readonly _origin: Point;
    private _pointsList: Point[] | null = null;

    ////////////////////////////////////////
    constructor(map: boolean[][], origin: Point) {
        this._map = map;
        this._origin = origin;
    }

    /** Returns true if a given point relative to this map's origin is within the shape described.
     * Any integer point is queryable, the map is treated as if projected onto an infinite plane. */
    get(point: Point) {
        // Translate this point-query by this shape's origin
        let p = point.add(this.origin);

        // Determine whether the point is retrievable from memory, or if the default false should be returned.
        let validPoint = (Common.validIndex(p.x, this.width) && Common.validIndex(p.y, this.height))
        return (validPoint) ? this._map[p.x][p.y] : false;
    }

    /** An integer point representing the center of axii for this shape. */
    get origin(): Point {
        return this._origin.clone();
    }

    /** A rectangle describing the bounds of this shape relative to its origin. */
    get rect(): PIXI.Rectangle {
        let o = this._origin;
        return new PIXI.Rectangle(-o.x, -o.y, this.width, this.height);
    }

    /** The number of columns which describe this RegionMap. */
    get width(): number {
        return this._map.length;
    }

    /** The number of rows which describe this RegionMap. */
    get height() {
        return this._map[0].length;
    }

    /** A list of Point objects which describe this RegionMap relative to its center. */
    get points(): Point[] {
        if (!this._pointsList) {
            this._pointsList = [];
            for (let x = 0; x < this.width; x++)
            for (let y = 0; y < this.height; y++) {
                if (this._map[x][y])
                    this._pointsList.push(new Point(x,y).subtract(this.origin));
            }
        }
        return this._pointsList.slice()
    }

    /** Returns true if the point p on this shape-map lies on an inclusive-edge
     * of the described shape. */
    extremity(p: Point): boolean {
        let neighbors = new NeighborMatrix<boolean>(this._map, p, false);
        let perimeterPoint = neighbors.orthogonals.some( coord => coord == false );
        return (neighbors.center == true && perimeterPoint);
    }

    /** Returns a value-copy of this shape's boolean map. */
    private mapCopy(): boolean[][] {
        let map = this._map.slice();
        map = map.map( col => col.slice() );
        return map;
    }

    /** Returns a new RegionMap object equivalent to this one's horizontal mirror. */
    flipHorz(): RegionMap {
        let map = this.mapCopy();
        map.reverse();
        return new RegionMap(map, this.origin);
    }

    /** Returns a new RegionMap object equivalent to this one's vertical mirror. */
    flipVert(): RegionMap {
        let map = this.mapCopy();
        map = map.map( col => col.reverse() );
        return new RegionMap(map, this.origin);
    }

    /** Returns a new RegionMap object, this one rotated by +90 degrees. */
    private _rotate90(): RegionMap {
        // Create a new, empty map in memory, already rotated +90.
        let map = new Array(this.height);
        for (let i = 0; i < this.height; i++)
            map[i] = new Array(this.width);

        // Map all this shape's points to the new, empty map.
        let maxY = this.height - 1;
        for (let x = 0; x < this.width; x++)
        for (let y = 0; y < this.height; y++) {
            map[x][y] = this._map[maxY - y][x];
            // this operation is principally [ <x,yi>i == <-y,xi> ] an imaginary rotation
        }
        let newOrigin = new Point(maxY - this.origin.y, this.origin.x);

        return new RegionMap(map, newOrigin);
    }

    /** Returns a new RegionMap object equivalent to this one rotated +90° the given
     * number of times. */
    rotate90(times: number): RegionMap {
        // Simplifies the rotate number. (a -3 rotation == a +1 rotation)
        times %= 4;
        if (times < 0)
            times += 4;

        let shape: RegionMap = this;

        // If times == 1 || 3
        if (times % 2 == 1)
            shape = shape._rotate90();

        // I assume this is faster than rotating +90° twice; is it?
        if (times == 2)
            shape = shape.flipHorz().flipVert();

        return shape;
    }
}

/** Helper function used to build standard min-to-max range maps for Advance Wars units. */
function rangeShapeAssembler(min: number, max: number) {
    // Case for empty map
    if (min < 0 || max < 0)
        return new RegionMap([[]], new Point());

    // Case for all other ranges
    let size = max*2 + 1;
    let center = Math.floor(size/2);
    let origin = new Point(center,center);
    let booleanMap = Common.Array2D(size, size, false);

    for (let x = 0; x < size; x++)
    for (let y = 0; y < size; y++) {
        let distance = origin.manhattanDistance(x,y);
        if (Common.within(distance, min, max))
            booleanMap[x][y] = true;
    }

    return new RegionMap(booleanMap, origin);
}

/** With serial keys, maintains a list of all once-requested maps. */
let regionMapSieve: StringDictionary<RegionMap> = {};

/** Calculates range-maps on request, or retrieves pre-calculated maps from a sieve. */
export function CommonRangesRetriever(range: NumericRange): RegionMap {
    const r = {
        min: Math.max(-1, range.min),
        max: Math.max(-1, range.max)
    };
    const serial = `${r.min}-${r.max}`;

    if (!regionMapSieve[serial])
        regionMapSieve[serial] = rangeShapeAssembler(r.min, r.max);

    return regionMapSieve[serial];
}