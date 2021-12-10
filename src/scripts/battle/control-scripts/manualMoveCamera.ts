import { Game } from "../../..";
import { Point } from "../../Common/Point";
import { TransformContainer } from "../../CommonTypes";
import { Common } from "../../CommonUtils";
import { Keys } from "../../controls/KeyboardObserver";
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
    this.lastInput.set(0,0);
    this.initialCameraPosition.set(camera.pos);
    this.followTargetSwap = camera.followTarget;
    camera.followTarget = null;
  }

  protected updateScript(): void {
    const { camera, map, mapCursor, gamepad } = this.assets;
    const { dpad } = gamepad.axis;

    // TODO Pick closest tile *in the direction of last input*

    const size = Game.display.standardLength;
    const noInput = dpad.point.equal(Point.Origin);

    // Update last axis input, if any were given.
    if (dpad.point.x !== 0) this.lastInput.x = dpad.point.x;
    if (dpad.point.y !== 0) this.lastInput.y = dpad.point.y;

    // Setup no-input target details
    const view = new Point(camera.viewFrame);
    const nearestTile = view.multiply(1/size).round().multiply(size);
    const vector = nearestTile.subtract(view);

    if (Game.devController.pressed(Keys.K))
      console.log(
        mapCursor.transform.pos.toString(),
        view.toString(),
        nearestTile.toString(),
        vector.toString(),
      )

    // Setup direction to be moved in
    const travelPoint = (noInput)
      ? vector.unit().multiply( Math.min(CAMERA_SPEED, vector.magnitude()) )
      : dpad.point.unit().multiply(CAMERA_SPEED);

    // Move the camera
    camera.pos = camera.pos.add(travelPoint);

    // Confine the camera to the map space
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