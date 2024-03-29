import { Common } from "../CommonUtils";

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

/** Returns true if the given object is interpretable as a point primitive.
 * The object's properties are assumed to be immutable to force style. */
export function isPointPrimitive(o: any): o is ImmutablePointPrimitive {
  return (typeof o.x === 'number' && typeof o.y === 'number');
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
   * y is assumed equal to x unless given. Returns self. */
  set(x: number | ImmutablePointPrimitive, y?: number) {
    const p = convertArgsToPoint(x, y);
    this.x = p.x;
    this.y = p.y;
    return this;
  }

  /** Returns a new vector: a value copy of this vector. */
  clone(): Point {
    return new Point().set(this);
  }

  /** Returns true if this point and the given point primitive or coords set are equal by value. */
  equal(x: number | ImmutablePointPrimitive, y?: number): boolean {
    const p = convertArgsToPoint(x, y);
    return (this.x === p.x && this.y === p.y);
  }

  /** Returns true if this point and the given point primitive or coords set are not equal by value. */
  notEqual(x: number | ImmutablePointPrimitive, y?: number): boolean {
    const p = convertArgsToPoint(x, y);
    return (this.x !== p.x || this.y !== p.y);
  }

  /** Returns a new vector: the sum of this and the given vector or vector coords.
   * y is assumed equal to x unless given. */
  add(x: number | ImmutablePointPrimitive, y?: number): Point {
    const p = convertArgsToPoint(x, y);
    return p.set(p.x + this.x, p.y + this.y);
  }

  /** Sums all points given with this one and returns the final vector as a point. */
  addAll(points: Point[]): Point {
    const list = [this, ...points];
    return list.reduce((sum, vector) => sum.add(vector));
  }

  /** Returns a new vector: the difference between this and the given vector or vector coords.
   * y is assumed equal to x unless given. */
  subtract(x: number | ImmutablePointPrimitive, y?: number): Point {
    const p = convertArgsToPoint(x, y);
    return this.add(p.negative());
  }
  
  /** Returns a new vector: the result of the given function applied to each vector component. */
  apply(f: (x: number) => number) {
    return this.clone().set( f(this.x), f(this.y) );
  }

  /** Returns a new vector: the result of the given function applied to each pair of vector components.
   * `new Point(f(x1,x2), f(y1,y2))` */
  merge(f: (a: number, b: number) => number, x: number | ImmutablePointPrimitive, y?: number): Point {
    const p = new Point(x,y);
    return new Point( f(this.x, p.x), f(this.y, p.y) );
  }

  /** Returns a new vector: this vector's additive inverse. */
  negative(): Point { return this.apply(x => -x); }

  /** Returns a new vector: this vector's absolute coordinates. */
  abs(): Point { return this.apply(Math.abs); }

  /** Returns a new vector: this vector's up-rounded coordinates. */
  ceil(): Point { return this.apply(Math.ceil); }

  /** Returns a new vector: this vector's down-rounded coordinates. */
  floor(): Point { return this.apply(Math.floor); }

  /** Returns a new vector: this vector's rounded coordinates. */
  round(): Point { return this.apply(Math.round); }

  /** Returns a new vector: this vector's truncated coordinates. */
  trunc(): Point { return this.apply(Math.trunc); }

  /** Returns a new vector: this vector's coordinates confined to
   * the interval [0,n], where n is the axis affected. */
  clamp(x: number | ImmutablePointPrimitive, y?: number): Point {
    const clamp = (x: number, max: number) => (max >= 0) ? Common.clamp(x, 0, max) : Common.clamp(x, max, 0);
    return this.merge(clamp, new Point(x,y));
  }

  /** Returns this point's coordinates as a sum. */
  sumCoords() {
    return this.x + this.y;
  }

  /** Returns a new vector: the scalar product of this vector and some scalar coefficient. */
  multiply(scalar: number | ImmutablePointPrimitive, yscalar?: number) {
    const p = convertArgsToPoint(scalar, yscalar);
    return new Point(
      this.x * p.x,
      this.y * p.y,
    );
  }

  /** Returns a new vector: the inverse of this vector's coordinates via the function 1/x  
   * Either of this vector's coordinates which are 0 remain 0 after the operation.  
   * Use with .multiply() for scalar division. */
  inverse() {
    return this.apply( n => (n === 0) ? 0 : 1 / n );
  }

  /** Returns the dot product between this and the given vector. */
  dot(b: ImmutablePointPrimitive) {
    const a = this;
    return a.x * b.x + a.y * b.y;
  }

  /** Returns the z-coordinate of the cross product between this and the given vector. */
  crossZ(b: ImmutablePointPrimitive) {
    const a = this;
    return a.x * b.y - a.y * b.x;
  }

  /** Gets the integer grid-distance between this point and a given point primitive or coords set.
   * y is assumed equal to x unless given. */
  manhattanDistance(x: number | ImmutablePointPrimitive, y?: number): number {
    const v = convertArgsToPoint(x, y).subtract(this);
    return v.manhattanMagnitude();
  }

  /** Gets the real distance between this point and a given point primitive or coords set.
   * y is assumed equal to x unless given. */
  distance(x: number | ImmutablePointPrimitive, y?: number): number {
    const v = convertArgsToPoint(x,y).subtract(this);
    return v.magnitude();
  }

  /** Returns the length of this vector. */
  magnitude(): number {
    const { x, y } = this;
    return Math.sqrt(x*x + y*y);
  }

  /** Returns this vector's manhattan distance from the origin. */
  manhattanMagnitude() {
    return this.abs().sumCoords();
  }

  /** Returns a vector with magnitude 1 in the same direction as this.
   * If this vector has no length, the returned vector will be the origin <0,0>. */
  unit(): Point {
    const mag = this.magnitude();
    return (mag !== 0) ? this.multiply(1 / mag) : Point.Origin;
  }

  /** Returns this vector's counter-clockwise angle from the positive x-axis in radians.
   * Ranges between -pi and pi. At pi radians, only returns +pi. */
  angle() {
    const sign = Math.sign(this.crossZ(Point.Right));
    let angle = Math.acos(this.x / this.magnitude()) * sign;
    if (angle === 0) angle = ((this.x < 0) ? Math.PI : 0);
    return angle;
  }

  /** Returns this vector's counter-clockwise angle from the positive x-axis in radians.
   * Ranges between 0 and 2*pi */
  polarAngle() {
    const tau = 2*Math.PI;
    return (tau - this.angle()) % tau;
  }

  /** Returns the absolute angle difference from this to the given vector. */
  angleDifference(b: Point) {
    const a = this;
    return Math.acos( a.dot(b) / (a.magnitude() * b.magnitude()) );
  }

  /** Returns the angle rotation of vector a to b. */
  angleTo(b: Point) {
    const sign = Math.sign(this.crossZ(b));
    return this.angleDifference(b) * sign;
  }

  /** Returns an integer between -1 and 1 indicating the clockwise spin of the shortest
   * rotational difference between this vector and the given one. 1 is clockwise. */
  clockDirectionTo(b: Point) {
    return -Math.sign(this.crossZ(b));
  }

  /** Returns a Point object equivalent to this rotated by the angle of the given vector. */
  rotateByVector(x: number | ImmutablePointPrimitive, y?: number) {
    const v = convertArgsToPoint(x, y).unit();
    return new Point(
      this.x * v.x - this.y * v.y,
      this.x * v.y + this.y * v.x
    )
  }

  /** Returns this point as a string of the form (x,y). */
  toString(): string {
    return `(${this.x},${this.y})`;
  }

  /** Returns this point as a simple point object with just its value properties. */
  toPrimitive(): ImmutablePointPrimitive {
    return {x:this.x, y:this.y};
  }

  // Common Vectors

  /** Additive identity vector with all components set to zero. */
  static get Origin(): Point { return new Point(0, 0); }
  /** Alias for Point.Origin: the additive identity vector. */
  static get Zero(): Point { return Point.Origin; }
  /** Unit vector pointing conventionally up. */
  static get Up(): Point { return new Point(0, -1); }
  /** Unit vector pointing conventionally down. */
  static get Down(): Point { return new Point(0, 1); }
  /** Unit vector pointing conventionally left. */
  static get Left(): Point { return new Point(-1, 0); }
  /** Unit vector pointing conventionally right. */
  static get Right(): Point { return new Point(1, 0); }

  /** Points representing normalized alignment values in 0-to-1,
   * top-left to bottom-right space. */
  static readonly Normals = {
    get TopLeft():      Point { return new Point(0   , 0  ); },
    get MiddleLeft():   Point { return new Point(0   , 0.5); },
    get BottomLeft():   Point { return new Point(0   , 1  ); },
    get TopRight():     Point { return new Point(1   , 0  ); },
    get MiddleRight():  Point { return new Point(1   , 0.5); },
    get BottomRight():  Point { return new Point(1   , 1  ); },
    get Center():       Point { return new Point(0.5 , 0.5); },
    get TopCenter():    Point { return new Point(0.5 , 0  ); },
    get BottomCenter(): Point { return new Point(0.5 , 1  ); },
  }

  /** All point vectors describing an axis direction. */
  static get Cardinals(): Point[] {
    return [Point.Up, Point.Right, Point.Down, Point.Left];
  }
}