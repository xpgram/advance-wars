import { Observable } from "../Observable";
import { ImmutablePointPrimitive, Point } from "./Point";

/** A point in 2-dimensional space which updates listeners on coordinate-change.
 * Note that this class simply and blindly extends the Point class, which itself
 * puts great effort into fitting in with a functional paradigm.
 * 
 * It is recommended that you perform whatever calculations you need to on a Point
 * object and simply use OPoint.set(point) to conform this OPoint to the given one.
 * 
 * // TODO Should this even inherit from point, then?
 * // What if it was literally just the methods provided here?
 **/
export class ObservablePoint extends Observable(Point) {

  get x() { return this._x; }
  set x(x) {
    this._x = x;
    this.updateListeners();
  }

  get y() { return this._y; }
  set y(y) {
    this._y = y;
    this.updateListeners();
  }

  set(x: number | ImmutablePointPrimitive, y?: number) {
    const p = new Point(x, y);
    this._x = p.x;
    this._y = p.y;
    this.updateListeners();
    return this;
  }

  destroy() {
    this.clearListeners();
  }

}