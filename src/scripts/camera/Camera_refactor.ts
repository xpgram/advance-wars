import * as PIXI from "pixi.js";
import { LowResTransform } from "../LowResTransform";
import { TransformContainer } from "../CommonTypes";
import { Game } from "../..";
import { Point } from "../Common/Point";
import { Common } from "../CommonUtils";
import { FollowAlgorithm, QuantizedScreenPush } from "../CameraFollowAlgorithms";
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

/**
 * Takes control of a PIXI container, usually the global stage, and manipulates it
 * to simulate camera movement and other camera features.
 * 
 * @author Dei Valko
 * @version 1.0.0
 */
export class Camera {

  /** A container for a set of transform objects which describe different aspects
   * of this camera's position. */
  transform = {
    ideal: new ViewRect(this),
    offset: new ViewRect(this),
  }

  /** A container for a set of not publically accessible transform objects which
   * describe different aspects of this camera's position.
   */
  private hiddenTransforms = {
    actual: new ViewRect(this),
    lastFrame: new ViewRect(this),
    vector: new ViewRect(this),
    render: new ViewRect(this),
  }

  get realTransform() { return this.hiddenTransforms.actual.clone(); }
  
}