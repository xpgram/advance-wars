import * as PIXI from "pixi.js";
import { LowResTransform } from "./LowResTransform";
import { TransformContainer } from "./CommonTypes";
import { Game } from "..";
import { Point } from "./Common/Point";
import { Common } from "./CommonUtils";
import { FollowAlgorithm, QuantizedScreenPush } from "./CameraFollowAlgorithms";

// TODO Camera should offer convenient data structures, like Points and Rectangles. Stuff that doesn't need any finessing, you know?
// TODO Case in point: worldFrame *uses a rectangle* but obstinately refuses to return it as-is; stop that.
// TODO Camera needs a getter for the on-screen tile size. Game.display.standard*zoom. Easy.
// TODO A lot of this was written to "cleverly" compartmentalize properties into handy getters.
//   I think this actually indicates a need for more sophisticated data structures. It probably always did, but I'm stubborn.
//   Here's the capital problem:
//     camera.x yields the camera's position
//     camera.center.x yields the camera-center's position
//     both are linked and update at the same time, literally the same instant
//     both are settable, their setting instantly affects the other
//     so, center, viewFrame, etc. are relational shortcuts to the standard camera properties.
//   Getting 'x' from the worldFrame is more clear.
//   Setting 'x' from the viewFrame is done a lot anyway, so provide a shortcut.
//   If I need rectangles with more functions, I can write my own class which extends Pixi's.
//   Maybe updating any property on viewFrame calls a listener which resyncs all camera frames.
// TODO focalFrame has 0 references, refactor viewFrame => focalFrame; the name is more clear.
// TODO Maintain an ideal 1:1 zoom rectangle. When camera needs to figure where the stage should be placed, extrapolate from
//   the ideal rectangle to the zoom-level rectangle; currently we're doing it the other way.
// TODO Zoom does not maintain a zoom number, it is only inferrable from the effects it has caused. This isn't *wrong*
//   but it feels really weird. And we can never calc-correct.

// TODO I want all coordinate setting to happen via the camera's center.
//   Any others are abstractions from this one real coordinate.
//   center > baseRect > worldRect
// The problem I'm fixing is that the topleft coordinates move on zoom which confuses the fuck
// out of the follow alg's quantizer. I need to build a vector or target position from the focal
// point, not the topleft.
// So, center coords won't fix this; I think I'd still like to have them, though. ... I think.
// Anyway, this refactor is fine, but... it's fine. I should just fix the follow alg rn first though.

/**
 * Takes control of a PIXI container, usually the global stage, and manipulates it
 * to simulate camera movement and other camera features.
 * 
 * @author Dei Valko
 * @version 1.0.0
 */
export class Camera {

  private baseDimensions = {
    // TODO Make this settable from the constructor
    // TODO Adjust it with the aspect ratio? Currently, zooming resets any funny business you've done with width/height back to these defaults.
    width: Game.display.renderWidth,
    height: Game.display.renderHeight
  }

  /** The camera's 'real' transform position and view within the game world.
   * Untainted by zoom or displacement. */
  idealFrame = new PIXI.Rectangle(
    0,
    0,
    this.baseDimensions.width,
    this.baseDimensions.height,
  );

  /**  */
  focalBorder = new PIXI.Rectangle(
    Game.display.standardLength * 2.5,
    Game.display.standardLength * 2.0,
    this.idealFrame.width - Game.display.standardLength * 2.5,
    this.idealFrame.height - Game.display.standardLength * 2.0,
  )

  /** The camera's translational displacement from it's 'real' position. */
  readonly offset = Point.Origin;

  /** The camera's scale factor, by length. */
  zoom = 1;

  /** The camera's zoom level by magnification of areas. */
  get magnification() { return Math.pow(this.zoom, 2); }
  set magnification(n: number) { this.zoom = Math.sqrt(n); }

  /** The camera's angle of rotation. Expressed in radians. */
  rotation = 0;

  /** The camera's height to width ratio. */
  get aspectRatio() {
    const { width, height } = this.worldFrame();
    return width / height;
  }

  /** A point representing the camera's center-of-frame coordinates. */
  get center(): Point {
    return new Point(
      this.idealFrame.x + this._center.x,
      this.idealFrame.y + this._center.y,
    );
  }
  set center(p: Point) {
    const vector = p.subtract(this.center);
    this.idealFrame.x += vector.x;
    this.idealFrame.y += vector.y;
  }
  private _center = new Point(
    this.idealFrame.width / 2,
    this.idealFrame.height / 2
  );

  /** A rectangle in world-space representing what the camera can see. */
  worldFrame(): PIXI.Rectangle {
    const { idealFrame, zoom, center } = this;
    const wShrink = idealFrame.width / zoom;
    const hShrink = idealFrame.height / zoom;
    return new PIXI.Rectangle(
      center.x - wShrink/2,
      center.y - hShrink/2,
      wShrink,
      hShrink,
    );
  }

  /** A rectangle in world-space representing what the camera considers in-view. */
  focalFrame(): PIXI.Rectangle {
    const wFrame = this.worldFrame();
    return new PIXI.Rectangle(
      wFrame.x + this.focalBorder.x,
      wFrame.y + this.focalBorder.y,
      this.focalBorder.width,
      this.focalBorder.height,
    );
  }

  /** The object which the camera will try to keep in frame. If null, the camera does not follow. */
  focalPoint: Point | null = null;

  /** Returns a point corresponding either to the target of focus, or the center of the camera if none exists. */
  getFocalPoint(): Point {
    return (this.focalPoint)
      ? this.focalPoint
      : this.center;
  }

  /** Called on every update; determines how the camera should move to keep the follow target in frame. */
  followAlgorithm: FollowAlgorithm | null = null;


  /**
   * @param stage The 'world' container the camera will manipulate to pan, rotate and zoom.
   */
  constructor(stage: PIXI.Container) {
    this.stage = stage;
    this.width = this.baseDimensions.width;
    this.height = this.baseDimensions.height;
    this.followAlgorithm = new QuantizedScreenPush();

    Game.scene.ticker.add(this.update, this, -1);
    // I presume priority -1 means this update happens last.
    // This is important such that the cursor doesn't move after the stage
    // has been adjusted to it but before the draw call.
  }

  /** The world or layer the camera will move to simulate camera movement. */
  get stage(): PIXI.Container | null {
    return (this.stageTransform.object as PIXI.Container | null);
  }
  set stage(object) {
    // Assign the new 'stage' to the camera.
    //@ts-expect-error
    this.stageTransform.object = object;
  }


  

  /** True if the camera's focal point is inside the view bounds. */
  get subjectInView(): boolean {
    const focal = this.getFocalPoint();
    return this.viewFrame.contains(focal.x, focal.y);
  }

  /** If camera has a follow target, it will move to keep that target in view. */
  private update() {
    // Follow the focused object, if an algorithm for doing so exists.
    if (this.followAlgorithm)
      this.followAlgorithm.update(this);

    // Adjust the stage to fit the camera — (Coordinates are un-zoomed to correctly translate to unmodified 2D space.)
    this.stageTransform.x = Math.round(-this.x * this.zoom);
    this.stageTransform.y = Math.round(-this.y * this.zoom);
    this.stageTransform.scale.x = this.zoom;
    this.stageTransform.scale.y = this.zoom;
    this.stageTransform.rotation = -this.rotation;
  }
}



function borderedScreenPush(camera: Camera) {
  // TODO Softcode these somewhere, or at least meaningfully hardcode them.
  let tileSize = 16;
  let border = tileSize * 2;
  let subjectInclusionBorder = 0; // 2; // ← This is a bandaid for something I *kind of* understand.
  let maxDist = tileSize * .5;            //   It prevents .subjectInView() from giving false negatives.

  // TODO This is obviously broken implementation.
  //@ts-ignore
  const borderRect = camera.borderRect;

  borderRect.x = border + 8 - subjectInclusionBorder;
  borderRect.y = border - subjectInclusionBorder;
  borderRect.width = camera.worldFrame.width - 2 * border - 16 + 2 * subjectInclusionBorder;
  borderRect.height = camera.worldFrame.height - 2 * border + 2 * subjectInclusionBorder;

  let focal = camera.getFocalPoint();

  let cam = {
    x: Math.floor(camera.x),
    y: Math.floor(camera.y),
    width: camera.width,
    height: camera.height
  }

  // Find absolute values from the world origin for the camera's inner-frame's edges.
  let left = cam.x + border + tileSize / 2;   // tileSize/2 feels nice since we're in super widescreen.
  let right = cam.x + cam.width - border - tileSize - tileSize / 2;
  let top = cam.y + border;
  let bottom = cam.y + cam.height - border - tileSize;

  // TODO Use camera.viewBorder, or whatever we're calling it..

  // The distance we intend to travel this frame.
  let moveDist = { x: 0, y: 0 };

  // Get horizontal distance
  if (focal.x > right)
    moveDist.x = focal.x - right;
  else if (focal.x < left)
    moveDist.x = focal.x - left;

  // Get vertical distance
  if (focal.y > bottom)
    moveDist.y = focal.y - bottom;
  else if (focal.y < top)
    moveDist.y = focal.y - top;

  moveDist.x = Common.clamp(moveDist.x, -maxDist, maxDist);
  moveDist.y = Common.clamp(moveDist.y, -maxDist, maxDist);

  // Move the frame.
  camera.x += moveDist.x;
  camera.y += moveDist.y;
}