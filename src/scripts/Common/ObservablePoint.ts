import { Point } from "pixi.js";
import { Observable } from "../Observable";

/** A point in 2-dimensional space which updates listeners on coordinate-change.
 * Note: this class simply extends 
 */
export class ObservablePoint extends Point Observable {

  get x() { return this._x; }
  set x(x) {
    this._x = x;
    this.updateListeners();
  }
  private _x: number = 0;

  get y() { return this._y; }
  set y(y) {
    this._y = y;
    this.updateListeners();
  }
  private _y: number = 0;

  destroy() {
    this.clearListeners();
  }

}