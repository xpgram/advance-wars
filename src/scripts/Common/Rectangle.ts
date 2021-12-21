import { Common } from "../CommonUtils";
import { Point, ImmutablePointPrimitive, isPointPrimitive } from "./Point";

export type RectanglePrimitive = {
  x: number,
  y: number,
  width: number,
  height: number,
}

function isRectangle(o: any): o is RectanglePrimitive {
  const {x,y,width,height} = o;
  return [x,y,width,height].every( prop => typeof prop === 'number');
}

/** A rectangle in 2-dimensional space. */
export class Rectangle {
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;

  get left() { return this.x; }
  get right() { return this.x + this.width; }
  get top() { return this.y; }
  get bottom() { return this.y + this.height; }

  get topleft() { return new Point(this.left, this.top); }
  get topright() { return new Point(this.right, this.top); }
  get bottomleft() { return new Point(this.left, this.bottom); }
  get bottomright() { return new Point(this.right, this.bottom); }

  get center() { return this.getImmutablePointPrimitiveByProportion(new Point(.5)); }


  constructor(x?: number | RectanglePrimitive | ImmutablePointPrimitive, y?: number, width?: number, height?: number) {
    this.set(x, y, width, height);
  }

  /** Sets this rectangles properties to those given. */
  set(x?: number | RectanglePrimitive | ImmutablePointPrimitive, y?: number, width?: number, height?: number): Rectangle {
    const o = x;
    // TODO I broke instanceof; I need an eval function
    if (isRectangle(o)) {
      const { x, y, width, height } = o;
      Object.assign(this, {x, y, width, height});
    } else if (isPointPrimitive(o)) {
      const { x, y } = o;
      Object.assign(this, {x, y});
    } else {
      Object.assign(this, {x, y, width, height});
    }
    return this;
  }

  /** Sets this rectangle's properties such that its edges are equivalent to the ones given. */
  setEdges(left: number, right: number, top: number, bottom: number): Rectangle {
    const { max, min } = Math;
    this.x = min(left, right);
    this.width = max(left, right) - this.x;
    this.y = min(top, bottom);
    this.height = max(top, bottom) - this.y;
    return this;
  }

  /** Returns a new rectangle with all its properties a product of this one's after applying the given function. */
  apply(f: (n: number) => number) {
    return new Rectangle(
      f(this.x),
      f(this.y),
      f(this.width),
      f(this.height),
    )
  }

  /** Returns a new rectangle with all its side-coordinates a product of this one's after applying the given function. */
  applyEdges(f: (n: number) => number) {
    const x = f(this.x);
    const y = f(this.y);
    return new Rectangle(
      x, y,
      f(this.right) - x,
      f(this.bottom) - y,
    )
  }

  /** Returns a new Rectangle with the same properties as this one. */
  clone(): Rectangle {
    return new Rectangle(this);
  }

  /** Returns true if this rectangle's properties are the same as the given one. */
  equal(rect: Rectangle): boolean {
    return (
      this.x === rect.x
      && this.y === rect.y
      && this.width === rect.width
      && this.height === rect.height
    )
  }

  /** Returns true if this rectangle's properties are the same as the given one. */
  notEqual(rect: Rectangle): boolean {
    return !this.equal(rect);
  }

  /** Grows (or shrinks with -n) the bounds of the rectangle by a set amount.
   * yPad is assumed to be the same as xPad unless specified.
   * Preserves the position of the coordinate at the anchor immutablepointprimitive, which is by default the center.
   * A rectangle cannot shrink more than its own axis length; a resulting width or height cannot be < 0. */
  pad(xPad: number, yPad?: number, anchor?: ImmutablePointPrimitive): Rectangle {
    const { max } = Math;

    yPad = yPad || xPad;
    anchor = anchor || new Point(.5);

    const newWidth = max(this.width + xPad, 0);
    const newHeight = max(this.height + yPad, 0);

    return new Rectangle(
      this.x + (newWidth - this.width)*anchor.x,
      this.y + (newHeight - this.height)*anchor.y,
      newWidth,
      newHeight,
    );
  }

  /** Returns a new Rectangle which shares all its edges with the most extreme coordinates given in the
   * list of objects to bound. */
  fit(...objects: (Rectangle | ImmutablePointPrimitive)[]): Rectangle {
    const { max, min } = Math;
    const rects = objects.map( r => new Rectangle(r) );   // Affirms all objects are Rectangles
    const x      = min(...rects.map(r => r.left));
    const width  = max(...rects.map(r => r.right)) - x;
    const y      = min(...rects.map(r => r.top));
    const height = max(...rects.map(r => r.bottom)) - y;
    return new Rectangle(x, y, width, height);
  }

  /** Returns a new Rectangle extended from this one such that no edge disincludes any area or immutablepointprimitive
   * contained within the objects given. */
  enlarge(...objects: (Rectangle | ImmutablePointPrimitive)[]): Rectangle {
    return this.fit(this, ...objects);
  }

  /** Returns true if this rectangle wholly encloses the given object's coordinate-space. */
  contains(other: Rectangle | ImmutablePointPrimitive): boolean {
    const rect = new Rectangle(other);
    return (
      this.left <= rect.left
      && this.right >= rect.right
      && this.top <= rect.top
      && this.bottom >= rect.bottom
    );
  }

  /** Returns the ratio of this rectangle's width to its height. */
  get aspectRatio() {
    return this.width / this.height;
  }

  /** Returns a new rectangle with a width proportional to its height by the given ratio. */
  setWidthByAR(ratio: number) {
    return new Rectangle(
      this.x,
      this.y,
      this.height * ratio,
      this.height,
    );
  }

  /** Returns a new rectangle with a height proportional to its width by the given ratio. */
  setHeightByAR(ratio: number) {
    return new Rectangle(
      this.x,
      this.y,
      this.width,
      this.width * ratio,
    );
  }

  /** Returns the geometric area of this rectangle. */
  get area() {
    return this.width * this.height;
  }

  /** Returns a new rectangle with coordinates truncated to include the largest area. */
  truncateOut() {
    const { floor, ceil } = Math;
    return new Rectangle(
      floor(this.x),
      floor(this.y),
      ceil(this.width),
      ceil(this.height),
    );
  }

  /** Returns a new rectangle with coordinates truncated to include the smallest area. */
  truncateIn() {
    const { floor, ceil } = Math;
    return new Rectangle(
      ceil(this.x),
      ceil(this.y),
      floor(this.width),
      floor(this.height),
    );
  }

  /** Returns true if this and the given rectangle have areas which share a coordinate space. */
  intersects(rect: Rectangle): boolean {
    const intersection = this.getIntersection(rect);
    return intersection.equal(Rectangle.Empty);
  }

  /** Returns the rectangle defined by the cross-section of this and the given rectangle.
   * Rectangles are not considered intersecting if they merely share a side.
   * If this and the given rect are not intersecting, returns an Empty rectangle. */
  getIntersection(rect: Rectangle): Rectangle {
    const { min, max } = Math;
    const l = max(this.left, rect.left);
    const t = max(this.top, rect.top);
    const r = min(this.right, rect.right);
    const b = min(this.bottom, rect.bottom);
    return (l < r && t < b)
      ? new Rectangle(l, t, r-l, b-t)
      : Rectangle.Empty;
  }

  /** Returns a coordinate relative to this rectangle's top-left corner and proportional to its width/height
   * by the given anchor immutablepointprimitive. Ex: anchor=(.8, .8) returns a immutablepointprimitive in the lower-right rectangle quadrant. */
  getImmutablePointPrimitiveByProportion(anchor: ImmutablePointPrimitive) {
    return new Point(
      this.left + anchor.x*this.width,
      this.top + anchor.y*this.height,
    )
  }

  /** Returns the minimum distance of a immutablepointprimitive to one of this rectangle's edges or vertices. */
  minimumDistanceTo(p: ImmutablePointPrimitive): number {   // TODO Include Rects as options too
    const { abs } = Math;
    const { left, right, top, bottom } = this;
    const vector = new Point(
      abs(Common.displacementFromRange(p.x, left, right)),
      abs(Common.displacementFromRange(p.y, top, bottom)),
    );
    return vector.magnitude();
  }

  /** Returns a string representation of this rectangle's properties. */
  toString() {
    const { top, left, bottom, right, width, height } = this;
    return `[${left} ${top} → ${right} ${bottom}, ${width}w ${height}h]`;
  }


  /** A rectangle object with all properties set to 0. */
  static get Empty() { return new Rectangle(); }

}
