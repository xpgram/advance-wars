import { Game } from "../../..";
import { Point } from "../../Common/Point";
import { TransformContainer } from "../../CommonTypes";
import { Common } from "../../CommonUtils";
import { ControlScript } from "../../ControlScript";

const CAMERA_SPEED = 7;   // How many tiles the camera travels per 60 frames (per second).

/** Enables directional-input control over the camera. */
export class ManualMoveCamera extends ControlScript {
  defaultEnabled(): boolean { return false; }

  private followTargetSwap: TransformContainer | Point | null = null;

  /** The last cumulative input direction to move the camera in.
   * Pressing down *then* right records the same as pressing down *and* right. */
  readonly lastInput = Point.Origin;

  /** The position of the camera before this script took focus (during enable). */
  readonly initialCameraPosition = Point.Origin;


  protected enableScript(): void {
    const { camera } = this.assets;
    // Save old camera configuration — disable the camera's follow algorithm
    this.initialCameraPosition.set(camera.pos);
    this.followTargetSwap = camera.followTarget;
    camera.followTarget = null;
  }

  protected updateScript(): void {
    const { camera, map, gamepad } = this.assets;
    const { dpad } = gamepad.axis;

    // Update last axis input, if any were given.
    if (dpad.point.x !== 0) this.lastInput.x = dpad.point.x;
    if (dpad.point.y !== 0) this.lastInput.y = dpad.point.y;

    // Move the camera
    const dirPoint = dpad.point.unit();
    const travelPoint = dirPoint.multiply(CAMERA_SPEED);
    camera.pos = camera.pos.add(travelPoint);

    // Confine the camera to the map space
    const size = Game.display.standardLength;
    const frame = camera.focalFrame;

    let min = Point.Origin;
    let max = new Point(
      map.width * size,
      map.height * size,
    )
    min = min.subtract(frame);
    max = max.subtract(
      frame.x + frame.width,  // TODO This is incorrect, but it's *almost*
      frame.y + frame.height, // correct. Why? What am I missing?
    )

    camera.x = Common.clamp(camera.x, min.x, max.x);
    camera.y = Common.clamp(camera.y, min.y, max.y);
  }

  protected disableScript(): void {
    const { camera } = this.assets;
    camera.followTarget = this.followTargetSwap;
  }
  
}