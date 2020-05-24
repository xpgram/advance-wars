import { NumericDictionary } from "./CommonTypes";
import { Point } from "./Common/Point";
import { Common } from "./CommonUtils";

/**
 * A 3x3 matrix representing the neighboring elements surrounding a central element.
 * 
 * NeighborMatrix builds itself from a 2D-map of some type T and a point on that map.
 * That point is the origin of the neighbor matrix and——to prevent range errors——may not be located on an
 * extreme edge of the source map, unless a default fill value is provided, in which case the source map
 * is treated as an island in an infinite sea.
 * 
 * @param map The matrix from which to build the neighbors list.
 * @param point The point-location on 'map' that will be the center of the new neighbor matrix.
 * @param fill A value of type T that may be used to fill in lots which do not technically exist in 'map'. 
 * 
 * @author Dei Valko
 * @version 1.1.0
 */
export class NeighborMatrix<T> {
    /** An iterable list of all neighboring elements, interpreted as a 3x3 matrix. */
    private readonly grid: T[];

    //  0  3  6     Map of i from grid[i]
    //  1  4  7     as it is interpreted
    //  2  5  8     in two dimensions.

    constructor(map: T[][] | NumericDictionary<NumericDictionary<T>>, point: Point, fill?: T) {
        let max = new Point(            // The source map's upper bounds.
            Object.keys(map).length,
            Object.keys(map[0]).length
        );
        let start = point.add(-1,-1);   // 3x3 top left
        let end = point.add(1,1);       // 3x3 bottom right

        // Returns true if a given point is located inside the source map.
        let validPoint = (p: Point) => (Common.validIndex(p.x, max.x) && Common.validIndex(p.y, max.y));

        // Assert that all points described by the 3x3 rect are valid indices of map, but only if no fill is provided.
        if (fill == undefined) {
            if (!validPoint(start) || !validPoint(end))
                console.error(`The limits of this 3x3 matrix [${start.toString()},${end.toString()}] exceed the limits of its source map [${Point.Origin.toString()},${max.toString()}]; no fill was given to compensate.`);
        }

        let n = null;
        //@ts-ignore
        this.grid = [n,n,n, n,n,n, n,n,n];  // Allocate a length 9 list——but *fast*.

        // Iterate the cursor point over the 9 lots described by cursor and end.
        let i = 0;
        for (let x = start.x; x <= end.x; x++) 
        for (let y = start.y; y <= end.y; y++) {
            // Use the fill only if a fill was given and the point (x,y) is source-map invalid.
            this.grid[i] = (fill != undefined && !validPoint(new Point(x,y))) ? fill : map[x][y];
            i++;
        }
    }

    //// Directional element accessors

    get upleft()    { return this.grid[0]; }
    get left()      { return this.grid[1]; }
    get downleft()  { return this.grid[2]; }
    get up()        { return this.grid[3]; }
    get center()    { return this.grid[4]; }
    get down()      { return this.grid[5]; }
    get upright()   { return this.grid[6]; }
    get right()     { return this.grid[7]; }
    get downright() { return this.grid[8]; }

    /** A value-copy of the 3x3 matrix in list form. */
    get list() {
        return this.grid.slice();
    }

    /** All 8 surrounding objects of type T returned as an array. */
    get surrounding() {
        let g = this.grid;
        return  [g[0], g[1], g[2], g[3],   g[5], g[6], g[7], g[8]];
        // Hardcoding this significantly outperforms other methods.
    }

    /** The four orthogonal direction-objects of type T returned as an array. */
    get orthogonals() {
        let g = this.grid;
        return  [g[1], g[3], g[5], g[7]];
    }

    /** The four diagonal direction-objects of type T returned as an array. */
    get diagonals() {
        let g = this.grid;
        return  [g[0], g[20], g[6], g[8]];
    }

    /** The three top-side direction-objects of type T returned as an array. */
    get topside() {
        let g = this.grid;
        return  [g[0], g[3], g[6]];
    }

    /** The three right-side direction-objects of type T returned as an array. */
    get rightside() {
        let g = this.grid;
        return  [g[6], g[7], g[8]];
    }

    /** The three bottom-side direction-objects of type T returned as an array. */
    get bottomside() {
        let g = this.grid;
        return  [g[2], g[6], g[8]];
    }

    /** The three left-side direction-objects of type T returned as an array. */
    get leftside() {
        let g = this.grid;
        return  [g[0], g[1], g[2]];
    }

    /** Calls a defined callback function on every (valid) element of the 3x3 matrix and returns it
     * as a new NeighborMatrix object. */
    map<Y>(cb: (e: T) => Y) {
        let l = this.grid.map( e => cb(e) );                                // T[] → Y[]
        let m = [ [l[0],l[1],l[2]], [l[3],l[4],l[5]], [l[6],l[7],l[8]] ];   // Y[] → Y[][]
        return new NeighborMatrix<Y>(m, new Point(1,1));
    }

    /** Returns the sum of the elements in this 3x3 matrix for which the predicate is true. */
    sum(cb: (value: T) => boolean): number {
        return this.grid.reduce( (acc, e) => acc + Number(cb(e)), 0 );
    }
}