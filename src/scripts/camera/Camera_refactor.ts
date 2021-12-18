import * as PIXI from "pixi.js";
import { LowResTransform } from "../LowResTransform";
import { TransformContainer } from "../CommonTypes";
import { Game } from "../..";
import { Point } from "../Common/Point";
import { Common } from "../CommonUtils";
import { FollowAlgorithm, NullAlgorithm, QuantizedScreenPush } from "../CameraFollowAlgorithms";
import { ViewRect } from "./ViewRect";

// TODO Camera, among a few other things, whatever they be, has three ViewRects.
// Transforms:
//  1- ideal: The ideal camera coordinates and settings: where cam *should* be.
//  2- actual: The real camera coordinates and settings: where cam *is*; read only.
//  2- (last): The real camera ... from last frame; private.
//  3- vector: The difference between this and last frame's actual transform.
//  4- offset: Camera coordinates and settings relative to actual; for screen shake.
//  5- (render): actual + offset, used for next draw(); private.
// Movement patterns:
//  1- Position alg: Sets a state for the camera to aim to transition to.
//  2- Approach alg: Sets a method of actual to ideal state travel.
//  3- Relative alg: Sets a method of motion relative to its cur (screen shake).

// TODO Because transform.actual is private, but is also how the camera actually moves,
// FollowAlgorithms will need to take a ViewRect and a focal point|undefined as inputs
// instead. This is probably more Functional anyway.

type AlgorithmSet = {
  destination: FollowAlgorithm;
  travel: FollowAlgorithm;
  displacement: FollowAlgorithm;
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
  focalPoint?: Point;

  /** The target state this camera aspires to. Set state here and let the follow algorithms do the rest. */
  readonly targetTransform = new ViewRect(this);

  /** Returns a readonly-purpose copy of this Camera's current transform. */
  currentTransform() { return this.hiddenTransforms.actual.clone(); }

  /** Returns a readonly-purpose copy of this Camera's render transform (includes offset changes/relative behavior). */
  renderTransform() { return this.hiddenTransforms.render.clone(); }

  /** A container for a set of not publically accessible transform objects which
   * describe different aspects of this camera's position. */
  private hiddenTransforms = {
    actual: new ViewRect(this),     // Current state
    offset: new ViewRect(this),     // Relative-to-current state
    lastFrame: new ViewRect(this),  // Last-frame's state
    // vector: new ViewRect(this),  // Vector from last-to-current state
    render: new ViewRect(this),     // Composition state (actual+offset) used for rendering
  }

  /** A container for a set of behavioral algorithms which describe the camera's
   * frame-by-frame movement. */
  algorithm: AlgorithmSet = {
    /** The method by which the camera will choose transform targets. */
    destination: new NullAlgorithm(),   // := target
    /** The method by which the camera will approach its current transform target. */
    travel: new NullAlgorithm(),        // actual → target
    /** A method by which the camera will mix additional behaviors into its normal behavior. */
    displacement: new NullAlgorithm(),  // := offset, actual+offset => render
  }

  // ...
  
}