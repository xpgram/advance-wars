import { Game } from "../..";
import { ValueError } from "../Common/ErrorTypes";
import { Point } from "../Common/Point";
import { Rectangle } from "../Common/Rectangle";
import { Camera } from "./Camera";
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

  /** This view's coordinate position in-world. */
  position = new Point();

  /** This view's zoom factor. A value of 1 is in parity with the view's base dimensions.
   * Setting zoom directly implicitly sets the focus to the topleft corner. Use zoomToPoint()
   * to specify a point-of-focus. */
  get zoom() { return this._zoom; }
  set zoom(n) {
    if (n <= 0) throw new ValueError(`Cannot set property 'zoom' to <= 0.`);
    this._zoom = n;
    // this.zoomToPoint(n, this.worldRect().center);
  }
  private _zoom: number = 1;

  /** Sets this view's zoom factor with respect to the given focal point.
   * Focal is a real-world coordinate, not proportional to this rect's dimensions. */
  zoomToPoint(n: number, focal: Point) {
    const last = this._zoom;
    const next = n;
    this._zoom = next;

    // reposition coordinates with respect to focal point
    const { x,     y,    } = this.position;
    const { x: ax, y: ay } = focal;
    this.position.set(
      ax - ((ax - x) * last / next),  // Formula resizes the distance from topleft to
      ay - ((ay - y) * last / next),  // anchor according to new zoom factor.
    );
  }

  /** Describes the subject view bounds within the view rect.
   * All positive integers here are biased towards the center from the side they describe. */
  border = new ViewRectBorder();

  /** Whether zoom-scale affects the in-frame border. */
  applyZoomToBorder = false;

  /** Whether the camera's subject of focus is in frame or not. Always true if the camera
   * has no subject. */
  get subjectInFrame(): boolean {
    const srect = this.subjectRect();
    const focal = this.camera.focalTarget;
    return !focal || srect.contains(focal.position);
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
    const { position: position, baseWidth, baseHeight, zoom: zoom } = this;
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
      [left, right, top, bottom] = [left, right, top, bottom].map( b => b / this.zoom );

    return new Rectangle(
      wrect.x + left, wrect.y + top,
      wrect.width - left - right,
      wrect.height - top - bottom,
    )
  }

  /** Returns a copy of this ViewRect as a new object. */
  clone(): ViewRect {
    const view = new ViewRect(this.camera);
    view.position.set(this.position);
    view.zoom = this.zoom;
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

  /** Returns true if the given ViewRect is not equivalent to this one. */
  notEqual(other: ViewRect) {
    return !this.equal(other);
  }

  /** Returns a delta-ViewRect holding the difference in properties from 'from' to self. */
  vectorFrom(other: ViewRect): ViewRectVector {
    const rectA = this.worldRect();
    const rectB = other.worldRect();

    const vector = new ViewRectVector();
    vector.position = rectA.topleft.subtract(rectB.topleft);
    vector.zoom = this.zoom - other.zoom;
    vector.border = this.border.subtract(other.border);

    return vector;
  }

  /** Returns a new ViewRect with properties combined from this and the given ViewRectVector. */
  addVector(vector: ViewRectVector): ViewRect {
    const view = this.clone();
    view.position = view.position.add(vector.position);
    view.zoom += vector.zoom;
    view.border = view.border.add(vector.border);
    return view;
  }

  /** Returns a string representation of this ViewRect's properties. */
  toString(): string {
    return `zoom=${this.zoom} view=${this.worldRect().toString()} focus=${this.subjectRect().toString()}`;
  }
 
}