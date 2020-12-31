
/** A point in 2-dimensional space.
 * @deprecated ImmutablePointPrimitive is preffered. */
export type PointPrimitive = {
    x: number,
    y: number
}

/** An unmodifiable point in 2-dimensional space. */
export type ImmutablePointPrimitive = {
    readonly x: number,
    readonly y: number
}

/** Returns true if p is of the ImmutablePointPrimitive type. */
function isImmutablePointPrimitive(p: undefined | number | ImmutablePointPrimitive): p is ImmutablePointPrimitive {
    return (typeof p == 'object');  // ImmutablePointPrimitive is confirmed implicitly
}

/** Converts a point primitive or coords set to a Point object. */
function convertArgsToPoint(x: number | ImmutablePointPrimitive, y?: number) {
    return new Point(x, y);     // Relies on method defined in constructor.
}

/** A point in 2-dimensional space. */
export class Point {
    x: number = 0;
    y: number = 0;

    constructor(x?: number | ImmutablePointPrimitive, y?: number) {
        if (isImmutablePointPrimitive(x)) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x || 0;
            this.y = (typeof y == 'number') ? y : this.x;   // allows y = 0
        }
    }

    /** Given a point primitive or a set of coords, copies the described point by value.
     * y is assumed equal to x unless given. */
    set(x: number | ImmutablePointPrimitive, y?: number) {
        let p = convertArgsToPoint(x, y);
        this.x = p.x;
        this.y = p.y;
    }

    /** Returns a new vector: a value copy of this vector. */
    clone(): Point {
        return new Point().add(this);
    }

    /** Returns true if this point and the given point primitive or coords set are equal by value. */
    equal(x: number | ImmutablePointPrimitive, y?: number): boolean {
        let p = convertArgsToPoint(x, y);
        return (this.x == p.x && this.y == p.y);
    }

    /** Returns true if this point and the given point primitive or coords set are not equal by value. */
    notEqual(x: number | ImmutablePointPrimitive, y?: number): boolean {
        let p = convertArgsToPoint(x, y);
        return (this.x != p.x || this.y != p.y);
    }

    /** Returns a new vector: the sum of this and the given vector or vector coords.
     * y is assumed equal to x unless given. */
    add(x: number | ImmutablePointPrimitive, y?: number): Point {
        let p = convertArgsToPoint(x, y);
        p.set(p.x + this.x, p.y + this.y);
        return p;
    }

    /** Sums all points given with this one and returns the final vector as a point. */
    addAll(points: Point[]): Point {
        let list = [this, ...points];
        let final = list.reduce( (sum, vector) => sum.add(vector) );
        return final;
    }

    /** Returns a new vector: the difference between this and the given vector or vector coords.
     * y is assumed equal to x unless given. */
    subtract(x: number | ImmutablePointPrimitive, y?: number): Point {
        let p = convertArgsToPoint(x, y);
        return this.add(p.negative());
    }

    /** Returns a new vector: this vector's additive inverse. */
    negative(): Point {
        return new Point(-this.x, -this.y);
    }

    /** Returns a new vector: the scalar product of this vector and some scalar coefficient. */
    multiply(scalar: number) {
        let p = this.clone();
        p.x *= scalar;
        p.y *= scalar;
        return p;
    }

    /** Gets the integer grid-distance between this point and a given point primitive or coords set.
     * y is assumed equal to x unless given. */
    manhattanDistance(x: number | ImmutablePointPrimitive, y?: number): number {
        let p = convertArgsToPoint(x, y);
        return Math.abs(p.x - this.x) + Math.abs(p.y - this.y);
    }

    /** Gets the real distance between this point and a given point primitive or coords set.
     * y is assumed equal to x unless given. */
    distance(x: number | ImmutablePointPrimitive, y?: number): number {
        let p = convertArgsToPoint(x, y);
        return Math.sqrt(Math.pow(p.x - this.x, 2) + Math.pow(p.y - this.y, 2));
    }

    /** Returns the length of this vector. */
    magnitude(): number {
        return this.distance(new Point());
    }

    /** Returns this point as a string of the form (x,y). */
    toString(): string {
        return `(${this.x},${this.y})`;
    }

    // Common Vectors

    /** Additive identity vector with all components set to zero. */
    static get Origin(): Point { return new Point(0,0); }
    /** Alias for Point.Origin: the additive identity vector. */
    static get Zero(): Point { return Point.Origin; }
    /** Identity vector pointing conventionally up. */
    static get Up(): Point { return new Point(0,-1); }
    /** Identity vector pointing conventionally down. */
    static get Down(): Point { return new Point(0,1); }
    /** Identity vector pointing conventionally left. */
    static get Left(): Point { return new Point(-1,0); }
    /** Identity vector pointing conventionally right. */
    static get Right(): Point { return new Point(1,0); }
}