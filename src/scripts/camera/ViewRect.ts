import { Game } from "../..";
import { ValueError } from "../Common/ErrorTypes";
import { Point } from "../Common/Point";
import { Rectangle } from "../Common/Rectangle";
import { Camera } from "./Camera_refactor";
import { ViewRectBorder } from "./ViewRectBorder";


/** Describes relative changes to or from a ViewRect. */
export class ViewRectVector {
  position = new Point();
  zoom = 0;
  border = new ViewRectBorder();
}

/** Describes a transform for a Camera object. */
export class ViewRect {

  private readonly camera: Camera;

  private readonly baseWidth = Game.display.renderWidth;
  private readonly baseHeight = Game.display.renderHeight;

  get position() { return this._position.clone(); }
  private _position = new Point();

  get zoom() { return this._zoom; }
  private _zoom: number = 1;

  /** Describes the subject view bounds within the view rect.
   * All positive integers here are biased towards the center from the side they describe. */
  border = new ViewRectBorder();

  /** Whether zoom-scale affects the in-frame border. */
  applyZoomToBorder = false;

  /** Whether the camera's subject of focus is in frame or not. Always true if the camera
   * has no subject. */
  get subjectInFrame(): boolean {
    const srect = this.subjectRect();
    const focal = this.camera.focalPoint;
    return !focal || srect.contains(focal);
  }


  constructor(ref: Camera) {
    this.camera = ref;
  }

  destroy() {
    //@ts-expect-error
    this.camera = undefined;
  }


  /** Returns a Rectangle corrosponding to the in-world coordinates of what this
   * ViewRect considers seeable. */
  worldRect() {
    const { _position: position, baseWidth, baseHeight, _zoom: zoom } = this;
    return new Rectangle(
      position.x, position.y,
      baseWidth / zoom,
      baseHeight / zoom,
    )
  }

  /** Returns a Rectangle corrosponding to the in-world coordinates of what this
   * ViewRect considers in-frame. */
  subjectRect() {
    let { left, right, top, bottom } = this.border;
    const wrect = this.worldRect();

    if (this.applyZoomToBorder)
      [left, right, top, bottom] = [left, right, top, bottom].map( b => b / this._zoom );

    return new Rectangle(
      wrect.x + left, wrect.y + top,
      wrect.width - right,
      wrect.height - bottom,
    )
  }

  /** Sets this rect's coordinates using its top-left corner as the origin. */
  setPosition(pos: Point) {
    this._position = pos;
  }

  /** Sets this rect's coordinates using its center as the origin. */
  setCenter(pos: Point) {
    const rect = this.worldRect();
    pos = pos.subtract(rect.width*0.5, rect.height*0.5);
    this.setPosition(pos);
  }

  /** Sets this ViewRect's zoom factor with respect to the given anchor point.
   * Anchor is a real-world coordinate, not proportional to this rect's dimensions.
   * Anchor is by default the ViewRect's center. */
  setZoom(n: number, anchor?: Point) {
    if (n <= 0)
      throw new ValueError(`Cannot set property 'zoom' to 0.`);

    anchor = anchor || this.worldRect().center;
    const last = this._zoom;
    const next = n;
    this._zoom = next;

    // reposition coordinates with respect to anchor point
    const { x, y } = this._position;
    const { x: ax, y: ay } = anchor;
    this._position.set(
      ax - ((ax - x) * last / next),  // Formula resizes the distance from topleft to
      ay - ((ay - y) * last / next),  // anchor according to new zoom factor.
    );
  }

  /** Returns a copy of this ViewRect as a new object. */
  clone(): ViewRect {
    const view = new ViewRect(this.camera);
    view._position.set(this._position);
    view._zoom = this._zoom;
    view.border = this.border;
    view.applyZoomToBorder = this.applyZoomToBorder;
    return view;
  }

  /** Returns true if the given ViewRect is equivalent to this one. */
  equal(other: ViewRect) {
    const sameRects = this.worldRect().equal(other.worldRect());
    const sameZoom = this.zoom === other.zoom;
    const sameBorder = this.border.equal(other.border);
    return sameRects && sameZoom && sameBorder;
  }

  /** Returns a delta-ViewRect holding the difference in properties from 'from' to self. */
  produceVector(from: ViewRect): ViewRectVector {
    const rectA = this.worldRect();
    const rectB = from.worldRect();

    const vector = new ViewRectVector();
    vector.position = rectA.topleft.subtract(rectB.topleft);
    vector.zoom = this.zoom - from.zoom;
    vector.border = this.border.subtract(from.border);

    return vector;
  }

  /** Returns a new ViewRect with properties combined from this and the given ViewRectVector. */
  addVector(vector: ViewRectVector): ViewRect {
    const view = this.clone();
    view._position = view._position.add(vector.position);
    view._zoom += vector.zoom;
    view.border = view.border.add(vector.border);
    return view;
  }
 
}