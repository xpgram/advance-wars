import { PIXI } from "../../constants";
import { Point } from "../Common/Point";
import { ViewRect, ViewRectVector } from "./ViewRect";
import { Game } from "../..";
import { UpdatePriority } from "../Common/UpdatePriority";
import { PositionalAlgorithm } from "./PositionalAlgorithms";
import { TravelAlgorithm } from "./TravelAlgorithms";
import { DisplacementAlgorithm } from "./DisplacementAlgorithms";
import { PositionContainer } from "../CommonTypes";
import { Debug } from "../DebugUtils";


type AlgorithmSet = {
  /** A function callback for correcting the target frame after the destination algorithm,
   * such as for confining it to some set of bounds. */
  destinationCorrection?: (target: ViewRect) => ViewRect;
  /** A function callback for filtering-on-retrieval the focal-object coordinates, such as
   * for confining it to some set of bounds. */
  focalCorrection?: (p: Point, target: ViewRect) => Point;
  /** The method by which the camera will choose transform targets. */
  destination?: PositionalAlgorithm;
  /** The method by which the camera will approach its current transform target. */
  travel?: TravelAlgorithm;
  /** A method by which the camera will mix additional behaviors into its normal behavior. */
  displacement?: DisplacementAlgorithm;
}

/**
 * Takes control of a PIXI container, usually the global stage, and manipulates it
 * to simulate camera movement and other camera features.
 * 
 * @author Dei Valko
 * @version 1.0.0
 */
export class Camera {

  /** The point, if present, which the camera will try to keep in frame. */
  get focalTarget() { return this._focalTarget; }
  set focalTarget(t) {
    const message = (t)
      ? `Now observing object at ${new Point(t.position).toString()}`
      : `Now observing no object.`
    Debug.log('Camera', 'ChangeFocalObject', { message });
    this._focalTarget = t;
  }
  private _focalTarget?: PositionContainer;

  /** The transform state this camera aspires to. Instantly moves the camera, or begins approaching
   * if a travel algorithm is set. */
  get transform() { return this._transform; }
  set transform(t) {
    Debug.log('Camera', 'MoveTarget', {
      message: `Moving transform target to ${t.toString()}`,
    });
    this._transform = t;
  }
  private _transform = new ViewRect(this);
  

  /** True if this camera's focal point is inside its view bounds. */
  get subjectInView(): boolean {
    const viewRect = this.hiddenTransforms.actual.subjectRect();
    const focal = this.getFocalPoint();
    return viewRect.contains(focal);
  }

  /** True if this camera's actual frame-rect is equal to its target frame-rect. */
  get doneTraveling(): boolean {
    return this.hiddenTransforms.actual.equal(this._transform);
  }

  /** Returns a readonly-purpose copy of this Camera's current transform. */
  currentTransform() { return this.hiddenTransforms.actual.clone(); }

  /** Returns a readonly-purpose copy of this Camera's render transform (includes offset changes/relative behavior). */
  renderTransform() { return this.hiddenTransforms.render.clone(); }

  /** A container for a set of not publically accessible transform objects which
   * describe different aspects of this camera's position. */
  private hiddenTransforms = {
    actual: new ViewRect(this),     // Current state
    offset: new ViewRectVector(),   // Relative-to-current state
    render: new ViewRect(this),     // Composition state (actual+offset) used for rendering
  }

  /** A container for a set of behavioral algorithms which describe the camera's
   * frame-by-frame movement. */
  // TODO Add algorithm-change logging
  algorithms: AlgorithmSet = { }

  /** The graphical object manipulated by this camera. */
  private stage: PIXI.Container;

  
  constructor(stage: PIXI.Container) {
    this.stage = stage;
    Game.scene.ticker.add(this.update, this, UpdatePriority.Camera);
  }

  destroy() {
    Game.scene.ticker.remove(this.update, this);
    Debug.log('Camera', 'Destruct', {
      message: `Camera object destroyed.`,
    })
  }

  /** Skips travel algorithm processes and instantly moves the camera to its current intended transform. */
  teleportToDestination() {
    this.algorithms.destination?.update(  // Update transform to current focal
      this._transform,
      this.getFocalPoint(),
      this
    )
    this.hiddenTransforms.actual = this._transform.clone();
    this.update();  // Is this necessary?
  }

  update() {
    const { destinationCorrection, destination, travel, displacement } = this.algorithms;
    const transforms = this.hiddenTransforms;

    // ViewRects are semi-functional, which means they're intended to
    // be cloned() in the update algs but it isn't necessarily enforced.
    // Be careful out there, yo.

    // Set target transform
    let nextTarget = (destination)
      ? destination.update(
          this._transform,
          this.getFocalPoint(),
          this,
        )
      : this._transform;
    nextTarget = (destinationCorrection)
      ? destinationCorrection(this._transform)
      : this._transform;

    if (nextTarget.notEqual(this._transform))
      this.transform = nextTarget;

    // Move actual transform
    transforms.actual = (travel)
      ? travel.update(
          transforms.actual,
          this._transform,
          this.getFocalPoint(),
        )
      : this._transform.clone();

    // Periodically log camera actual position
    if (Game.frameCount % 60*5 === 0)
      Debug.log('Camera', 'UpdatePosition', {
        message: `Non-displaced, actual transform is currently ${transforms.actual.toString()} with focal ${this.getFocalPoint().toString()}`,
      });

    // Get behavior and set final transform
    transforms.offset = displacement?.get() || new ViewRectVector();
    transforms.render = transforms.actual.addVector(transforms.offset);

    // Modify stage to reflect render transform
    const viewRect = transforms.render.worldRect();
    const { zoom } = transforms.render;
    this.stage.position.set(
      -viewRect.x * zoom,
      -viewRect.y * zoom,
    );
    this.stage.scale.set(zoom);
  }

  /** Returns a point corresponding either to the target of focus or the center of the camera's view. */
  getFocalPoint(): Point {
    const filter = this.algorithms.focalCorrection ?? (p => p);
    return (this._focalTarget)
      ? filter(new Point(this._focalTarget.position), this._transform)
      : this.hiddenTransforms.actual.worldRect().center;
  }
  
}