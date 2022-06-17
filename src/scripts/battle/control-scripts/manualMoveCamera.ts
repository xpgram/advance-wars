import { Game } from "../../..";
import { Point } from "../../Common/Point";
import { PositionContainer } from "../../CommonTypes";
import { Common } from "../../CommonUtils";
import { Keys } from "../../controls/KeyboardObserver";
import { ControlScript } from "../../ControlScript";


/** Enables directional-input control over the camera. */
export class ManualMoveCamera extends ControlScript {
  defaultEnabled(): boolean { return false; }

  private focalSwap?: PositionContainer;
  private cameraLead = Point.Origin;

  /** The last cumulative input direction to move the camera in.
   * Pressing down *then* right records the same as pressing down *and* right. */
  readonly lastInput = Point.Origin;

  /** The position of the camera before this script took focus (during enable). */
  readonly initialCameraPosition = Point.Origin;


  protected enableScript(): void {
    const { camera } = this.assets;
    this.lastInput.set(0,0);

    // TODO To better serve .toPointerPosition(), this should tighten the camera subject bounds.
    // I don't have a framework for doing that yet, though.
    // I suppose maybe the camera should have some default settings that get set every turn state change?
    // That's kind of what camera is missing, right?

    const rect = camera.transform.worldRect();
    this.initialCameraPosition.set(new Point(rect));
    this.cameraLead.set(rect.center);
    this.focalSwap = camera.focalTarget;
    camera.focalTarget = {position: this.cameraLead};
  }

  protected updateScript(): void {
    const { camera, map, gamepad } = this.assets;
    const { dpad } = gamepad.axis;
    const tileSize = Game.display.standardLength;

    // Update last travel input
    this.lastInput.set(
      (dpad.point.x !== 0) ? dpad.point.x : this.lastInput.x,
      (dpad.point.y !== 0) ? dpad.point.y : this.lastInput.y,
    );

    // Camera's current target transform
    const rect = camera.transform.worldRect();

    // If the camera is approaching a destination (likely one given by this script), do nothing
    if (!camera.doneTraveling)
      return;

    // Move the camera lead to a point outside the camera's viewframe, unless no input.
    const leadDist = 2;
    this.cameraLead.set(
      rect.center.x + (rect.width/2 + leadDist)*dpad.point.x,
      rect.center.y + (rect.height/2 + leadDist)*dpad.point.y,
    )

    // Confine the camera to the map space
    const max = new Point()
      .add(
        (map.width - 1) * tileSize,
        (map.height - 1) * tileSize,
      )

    this.cameraLead.x = Common.clamp(this.cameraLead.x, 0, max.x);
    this.cameraLead.y = Common.clamp(this.cameraLead.y, 0, max.y);
  }

  protected disableScript(): void {
    const { camera } = this.assets;
    camera.focalTarget = this.focalSwap;
  }

  toPointerPosition(p: Point) {
    this.lastInput.set(p.subtract(this.cameraLead));
    this.cameraLead.set(p);
  }

}