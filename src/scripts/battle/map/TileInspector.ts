import { Map } from "./Map";
import { Point } from "../../Common/Point";
import { Square } from "./Square";
import { CardinalDirection, CardinalVector, CardinalVectorToCardinal } from "../../Common/CardinalDirection";
import { MoveType } from "../EnumTypes";
import { Debug } from "../../DebugUtils";

/** Map's path-finding algorithm tool. Used to draw hypothetical travel lines across
 * the game-board while keeping track of travel metrics such as overall movement cost.
 */
export class TileInspector {

    /** Reference to the game-board being inspected. */
    private map: Map;
    
    /** The list of points describing the inspector's travel. Always contains at least the
     * traveler's starting location. */
    private _points: Point[];

    /** The remaining spendable movement points. This is a metric and imposes no limits on
     * the inspector's movement. */
    private _movePoints: number;

    /** The method of travel the inspector will use for metrics. */
    private _moveType: MoveType;

    ////////////////////////////////////////
    constructor(map: Map, point: Point, movePoints: number, moveType: MoveType) {
        this.map = map;
        this._points = [point];
        this._movePoints = movePoints;
        this._moveType = moveType;
    }

    /** The point-location being observed by the inspector. */
    get point(): Point {
        return this._points[this._points.length - 1];
    }

    /** A copy of the list of points describing this inspector's travel path. */
    get path(): Point[] {
        return this._points.slice();
    }

    /** Returns the Square object located on the game-board at this inspector's point-location. */
    get square(): Square {
        return this.map.squareAt(this.point);
    }

    /** The remaining spendable movement points. This is a metric and imposes no limits on
     * the inspector's freedom of movement. */
    get movePoints(): number {
        return this._movePoints;
    }

    /** Translates the inspector one tile in some cardinal direction.
     * The inspector will refuse to move into a point-location already contained in its path. */
    private relativeMoveDir(dir: CardinalDirection) {
        let result = false;

        // Do not add a point to path that already has been.
        let next = this.point.add( CardinalVector(dir) );
        if (this.findPoint(next) == -1) {
            this._points.push(next);
            this._movePoints -= this.square.terrain.getMovementCost(this._moveType);
            result = true;
        }

        return result;
    }

    /** Translates the inspector to its last point-location, undoing the applied travel
     * metrics. If there is no move to undo, this method does nothing. */
    private relativeMoveUndo() {
        let result = false;

        // points[] must always contain at least the traveler's starting location.
        if (this._points.length > 1) {
            this._movePoints += this.square.terrain.getMovementCost(this._moveType);
            this._points.pop();
            result = true;
        }

        return result;
    }

    /** Returns a new inspector translated one tile in some cardinal direction.
     * The request to move into a point already contained in the inspector's path will be refused. */
    moveDir(dir: CardinalDirection): TileInspector {
        let inspector = this.clone();
        let moved = inspector.relativeMoveDir(dir);
        return (moved) ? inspector : this;
    }

    /** Returns a new inspector with a set of travel instructions built from pre-existing links
     * between Squares on the game-board, starting at the Square currently being observed. */
    buildExistingTrack() {
        let buildTrack = true;
        let inspector = this.clone();

        while (buildTrack) {
            buildTrack = inspector.relativeMoveDir(inspector.square.arrowTo);
        }

        return inspector;
    }

    /** Returns the index of the given point in the path array, or undefined if not contained. */
    findPoint(p: Point): number {
        return this._points.findIndex( point => point.equal(p) );
    }

    /** Returns a new inspector with n fewer travel instructions. */
    shortenPath(n: number) {
        let reduceTrack = true;         // This just prevents looping without doing any work
        let inspector = this.clone();

        while (n > 0 && reduceTrack) {
            reduceTrack = inspector.relativeMoveUndo();
            n--;
        }

        return inspector;
    }

    /** Returns a new inspector with a set of travel instructions shortened to the given
     * indice. Indices out-of-range are treated as min and max element. */
    shortenToIndex(i: number) {
        let diff = this._points.length - 1 - i;
        return this.shortenPath(diff);
    }

    /** Returns a new inspector object, a value-copy of this one. */
    clone() {
        let inspector = new TileInspector(this.map, this.point, this._movePoints, this._moveType);
        inspector._points = this._points.slice();

        return inspector;
    }
}