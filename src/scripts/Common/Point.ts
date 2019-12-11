
/** A point in 2-dimensional space. */
export type PointPrimitive = {
    x: number,
    y: number
}

/** A point object representing one in 2-dimensional space, but with extra, useful methods. */
export class Point {
    x: number = 0;
    y: number = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /** Gets the integer grid-distance between this point and a given point. */
    taxicabDistance(point: PointPrimitive) {
        return Math.abs(point.x - this.x) + Math.abs(point.y - this.y);
    }

    /** Gets the real distance between this point and a given point. */
    distance(point: PointPrimitive) {
        return Math.sqrt(Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2));
    }
}