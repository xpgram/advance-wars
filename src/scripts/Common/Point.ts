
/** A point in 2-dimensional space. */
export type PointPrimitive = {
    x: number,
    y: number
}

/** A point object representing one in 2-dimensional space, but with extra, useful methods. */
export class Point {
    x: number = 0;
    y: number = 0;

    constructor(x?: number | PointPrimitive, y?: number) {
        let isPointPrimitive = (p: any): p is PointPrimitive => {
            return (p.x != undefined);  // y's presence is confirmed implicitly
        }

        if (isPointPrimitive(x)) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x || 0;
            this.y = typeof y == 'number' ? y : this.x;     // TODO Clean this little bit up
        }
    }

    /** Returns a new vector: a complete copy of this vector. */
    clone(): Point {
        return (new Point()).add(this);
    }

    /** Returns a new vector: the sum of this and the given vector. */
    add(p: PointPrimitive): Point {
        return new Point((this.x + p.x), (this.y + p.y));
    }

    /** Returns a new vector: the sum of this vector and the given vector coordinates. */
    addCoords(x: number, y: number): Point {
        return this.add({x:x, y:y});
    }

    /** Gets the integer grid-distance between this point and a given point. */
    taxicabDistance(point: PointPrimitive): number {
        return Math.abs(point.x - this.x) + Math.abs(point.y - this.y);
    }

    /** Gets the real distance between this point and a given point. */
    distance(point: PointPrimitive): number {
        return Math.sqrt(Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2));
    }

    // Common Vectors

    /** Identity vector pointing conventionally up. */
    static get Up(): Point { return new Point(0,-1); }
    /** Identity vector pointing conventionally down. */
    static get Down(): Point { return new Point(0,1); }
    /** Identity vector pointing conventionally left. */
    static get Left(): Point { return new Point(-1,0); }
    /** Identity vector pointing conventionally right. */
    static get Right(): Point { return new Point(1,0); }
}