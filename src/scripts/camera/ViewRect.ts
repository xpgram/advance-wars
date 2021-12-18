import { Game } from "../..";
import { ValueError } from "../Common/ErrorTypes";
import { Point } from "../Common/Point";
import { Rectangle } from "../Common/Rectangle";
import { Camera } from "./Camera_refactor";

/** Describes a transform for a Camera object. */
export class ViewRect {

  private camera: Camera;

  private baseWidth = Game.display.renderWidth;
  private baseHeight = Game.display.renderHeight;

  private position = new Point();
  private zoom: number = 1;

  /** Describes the subject view bounds within the view rect.
   * All positive integers here are biased towards the center from the side they describe. */
  border = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }

  /** Whether zoom-scale affects the in-frame border. */
  applyZoomToBorder = false;

  /** Whether the camera's subject of focus is in frame or not. Always true if the camera
   * has no subject. */
  get subjectInFrame(): boolean {
    const srect = this.subjectRect();
    const focal = this.camera.focal;
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
    const { position, baseWidth, baseHeight, zoom } = this;
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
      wrect.width - right,
      wrect.height - bottom,
    )
  }

  /** Sets this rect's coordinates using its top-left corner as the origin. */
  setPosition(pos: Point) {
    this.position = pos;
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
    const last = this.zoom;
    const next = n;
    this.zoom = next;

    // reposition coordinates with respect to anchor point
    const { x, y } = this.position;
    const { x: ax, y: ay } = anchor;
    this.position.set(
      ax - ((ax - x) * last / next),  // Forumula resizes the distance from x,y to
      ay - ((ay - y) * last / next),  // anchor according to new zoom factor.
    );
  }

  /** Returns a copy of this ViewRect as a new object. */
  clone(): ViewRect {
    
  }

  /** Returns a delta-ViewRect holding the difference in properties from 'from' to self. */
  produceVector(from: ViewRect): ViewRect {

  }
 
}