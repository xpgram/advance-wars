import { Observable } from "../Observable";
import { ImmutablePointPrimitive, Point } from "./Point";

/** A point in 2-dimensional space which updates listeners on coordinate-change.
 * This class is complementary to the Point class and offers none of the same conveniences.
 * It is recommended that you use Point to conduct calculations and then simply set() that
 * point to this one.
 **/
export class ObservablePoint extends Observable() {

  get x() { return this._x; }
  set x(x) {
    this._x = x;
    this.updateListeners();
  }
  protected _x = 0;

  get y() { return this._y; }
  set y(y) {
    this._y = y;
    this.updateListeners();
  }
  protected _y = 0;

  set(x: number | ImmutablePointPrimitive, y?: number) {
    const p = new Point(x, y);
    this._x = p.x;
    this._y = p.y;
    this.updateListeners();
  }

  destroy() {
    this.clearListeners();
  }

}