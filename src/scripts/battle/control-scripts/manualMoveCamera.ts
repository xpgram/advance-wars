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
  private cameraLead = Point.Origin;

  /** The last cumulative input direction to move the camera in.
   * Pressing down *then* right records the same as pressing down *and* right. */
  readonly lastInput = Point.Origin;

  /** The position of the camera before this script took focus (during enable). */
  readonly initialCameraPosition = Point.Origin;


  protected enableScript(): void {
    const { camera } = this.assets;
    this.lastInput.set(0,0);
    this.initialCameraPosition.set(camera.pos);

    this.cameraLead.set(camera.center);
    this.followTargetSwap = camera.followTarget;
    camera.followTarget = this.cameraLead;
  }

  protected updateScript(): void {
    const { camera, map, gamepad } = this.assets;
    const { dpad } = gamepad.axis;

    // Update last travel input

    this.lastInput.set(
      (dpad.point.x !== 0) ? dpad.point.x : this.lastInput.x,
      (dpad.point.y !== 0) ? dpad.point.y : this.lastInput.y,
    );

    // Move the camera lead to a point outside the camera's viewframe, unless no input.

    this.cameraLead.set(
      camera.center.x + (camera.width/2 + CAMERA_SPEED)*dpad.point.x,
      camera.center.y + (camera.height/2 + CAMERA_SPEED)*dpad.point.y,
    )

    // Confine the camera to the map space

    const max = new Point()
      .add(
        (map.width - 1) * 16,
        (map.height - 1) * 16,
      )

    this.cameraLead.x = Common.clamp(this.cameraLead.x, 0, max.x);
    this.cameraLead.y = Common.clamp(this.cameraLead.y, 0, max.y);
  }

  protected disableScript(): void {
    const { camera } = this.assets;
    camera.followTarget = this.followTargetSwap;
  }
  
}