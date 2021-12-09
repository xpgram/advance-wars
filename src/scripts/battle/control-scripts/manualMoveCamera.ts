import { Game } from "../../..";
import { Camera } from "../../Camera";
import { Point } from "../../Common/Point";
import { TransformContainer } from "../../CommonTypes";
import { Common } from "../../CommonUtils";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { ControlScript } from "../../ControlScript";
import { Map } from "../map/Map";

const CAMERA_SPEED = 7;   // How many tiles the camera travels per 60 frames (per second).

/** Enables directional-input control over the camera. */
export class ManualMoveCamera extends ControlScript {
  defaultEnabled(): boolean { return false; }

  private gamepad: VirtualGamepad;
  private camera: Camera;
  private map: Map;

  private followTargetSwap: TransformContainer | Point | null = null;

  /** The last cumulative input direction to move the camera in.
   * Pressing down *then* right records the same as pressing down *and* right. */
  readonly lastInput = Point.Origin;

  /** The position of the camera before this script took focus (during enable). */
  readonly initialCameraPosition = Point.Origin;


  constructor(gamepad: VirtualGamepad, camera: Camera, map: Map) {
    super();
    this.gamepad = gamepad;
    this.camera = camera;
    this.map = map;
  }

  protected enableScript(): void {
    const { camera } = this;
    // Save old camera configuration — disable the camera's follow algorithm
    this.initialCameraPosition.set(camera.pos);
    this.followTargetSwap = camera.followTarget;
    camera.followTarget = null;
  }

  protected updateScript(): void {
    const { camera, map, gamepad } = this;
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
    const min = Point.Origin;
    const max = new Point(
      map.width * size,
      map.height * size,
    )
    min.subtract(camera.focalFrame);
    max.subtract(
      camera.focalFrame.width + size,
      camera.focalFrame.height + size,
    )
    camera.x = Common.clamp(camera.x, min.x, max.x);
    camera.y = Common.clamp(camera.y, min.y, max.y);
  }

  protected disableScript(): void {
    const { camera } = this;
    camera.followTarget = this.followTargetSwap;
  }
  
}