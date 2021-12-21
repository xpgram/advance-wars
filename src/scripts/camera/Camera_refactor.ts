import { Point } from "../Common/Point";
import { ViewRect, ViewRectVector } from "./ViewRect";
import { Game } from "../..";
import { UpdatePriority } from "../Common/UpdatePriority";
import { PositionalAlgorithm } from "./PositionalAlgorithms";
import { TravelAlgorithm } from "./TravelAlgorithms";
import { DisplacementAlgorithm } from "./DisplacementAlgorithms";
import { ViewRectBorder } from "./ViewRectBorder";
import { PositionContainer } from "../CommonTypes";


type AlgorithmSet = {
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
  focalTarget?: PositionContainer;

  /** The target state this camera aspires to. Set state here and let the follow algorithms do the rest. */
  readonly targetTransform = new ViewRect(this);

  /** True if this camera's focal point is inside its view bounds. */
  get subjectInView(): boolean {
    const viewRect = this.hiddenTransforms.actual.subjectRect();
    const focal = this.getFocalPoint();
    return viewRect.contains(focal);
  }

  /** True if this camera's actual frame-rect is equal to its target frame-rect. */
  get doneTraveling(): boolean {
    return this.hiddenTransforms.actual.equal(this.targetTransform);
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
    lastFrame: new ViewRect(this),  // Last-frame's state
    render: new ViewRect(this),     // Composition state (actual+offset) used for rendering
  }

  /** A container for a set of behavioral algorithms which describe the camera's
   * frame-by-frame movement. */
  algorithm: AlgorithmSet = { }

  /** The graphical object manipulated by this camera. */
  private stage: PIXI.Container;

  
  constructor(stage: PIXI.Container) {
    this.stage = stage;
    Game.scene.ticker.add(this.update, this, UpdatePriority.Camera);
  }

  destroy() {
    Game.scene.ticker.remove(this.update, this);
  }

  update() {
    const { destination, travel, displacement } = this.algorithm;
    const transforms = this.hiddenTransforms;

    // Update transforms
    destination?.update(
      this.targetTransform,
      this.focalTarget || transforms.actual.worldRect().center,
    )
    travel?.update(
      transforms.actual,
      this.targetTransform,
    )
    transforms.offset = displacement?.get() || new ViewRectVector();
    transforms.render = transforms.actual.addVector(transforms.offset);

    // Modify stage to reflect render transform
    const viewRect = transforms.render.worldRect();
    const zoom = transforms.render.zoom;

    this.stage.position.set(
      -viewRect.x * zoom,
      -viewRect.y * zoom,
    );
    this.stage.scale.set(zoom);
      // this.stage.rotation = transforms.render.
  }

  /** Returns a point corresponding either to the target of focus or the center of the camera's view. */
  getFocalPoint(): Point {
    return this.focalTarget || this.hiddenTransforms.actual.worldRect().center;
  }

  // TODO I don't like this solution, I just need something during prototyping.
  /** Sets border to all relevant transforms. */
  setBorder(border: ViewRectBorder) {
    this.targetTransform.border = border;
    this.hiddenTransforms.actual.border = border;
  }
  
}