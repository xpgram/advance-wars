import { Point } from "../../Common/Point";
import { NeighborMatrix } from "../../NeighborMatrix";
import { Common } from "../../CommonUtils";

/**  */
export class AttackShape {
    private readonly _map: boolean[][];
    private readonly _origin: Point;

    constructor(map: boolean[][], origin: Point) {
        this._map = map;
        this._origin = origin;
    }

    /** Returns true if a given point relative to this shape's origin is within the shape described.
     * Any integer point is queryable, the shape is treated as if projected onto an infinite plane. */
    get(point: Point) {
        // Translate this point-query by this shape's origin
        let p = point.add(this.origin);

        // Determine whether the point is retrievable from memory, or if the default false should be returned.
        let validPoint = (Common.validIndex(p.x, this._map.length) && Common.validIndex(p.y, this._map[0].length))
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

    /** Returns the integer width of this AttackShape. */
    get width(): number {
        return this._map.length;
    }

    /** Returns the integer height of this AttackShape. */
    get height() {
        return this._map[0].length;
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

    /** Returns a new AttackShape object equivalent to this one's horizontal mirror. */
    flipHorz(): AttackShape {
        let map = this.mapCopy();
        map.reverse();
        return new AttackShape(map, this.origin);
    }

    /** Returns a new AttackShape object equivalent to this one's vertical mirror. */
    flipVert(): AttackShape {
        let map = this.mapCopy();
        map = map.map( col => col.reverse() );
        return new AttackShape(map, this.origin);
    }

    /** Returns a new AttackShape object, this one rotated by +90 degrees. */
    private _rotate90() {
        // Create a new, empty map in memory, already rotated +90.
        let map = new Array(this.height);
        for (let i = 0; i < this.height; i++)
            map[i] = new Array(this.width);

        // Map all this shape's points to the new, empty map.
        let width = this.width;
        let height = this.height;
        for (let x = 0; x < width; x++)
        for (let y = 0; y < height; y++) {
            map[y][x] = this._map[x][height - 1 - y];
            // this operation is principally [ <x,yi>i == <-y,xi> ] an imaginary rotation
        }
        let newOrigin = new Point(this.origin.x, height - 1 - this.origin.y);

        return new AttackShape(map, newOrigin);
    }

    /** Returns a new AttackShape object equivalent to this one rotated +90 degrees
     * the given number of times. */
    rotate90(times: number): AttackShape {
        // Simplifies the rotate number (a -3 rotation == a +1 rotation)
        times %= 4;
        if (times < 0)
            times += 4;

        let shape: AttackShape = this;

        // If times == 1 || 3
        if (times % 2 == 1)
            shape = shape._rotate90();

        // If times == 2 || 3
        if (times >= 2)
            shape = shape.flipHorz().flipVert();

        return shape;
    }
}