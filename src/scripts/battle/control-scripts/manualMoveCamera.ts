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
  private readonly lastInput = Point.Origin;

  private readonly virtualCursorPos = Point.Origin;

  private lastInputWasPointer = false;

  /** The position of the camera before this script took focus (during enable). */
  readonly initialCameraPosition = Point.Origin;


  protected enableScript(): void {
    const { camera, mapCursor } = this.assets;
    this.lastInput.set(0,0);
    this.virtualCursorPos.set(mapCursor.boardLocation);
    this.lastInputWasPointer = false;

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
    const { camera, gamepad } = this.assets;
    const { dpad } = gamepad.axis;

    this.updateLastCameraTravelVector(dpad.point);

    if (dpad.roaming)
      this.lastInputWasPointer = false;

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

    this.clampCameraLead();
  }

  protected disableScript(): void {
    const { camera } = this.assets;
    camera.focalTarget = this.focalSwap;
  }

  private clampCameraLead() {
    const { map } = this.assets;
    const tileSize = Game.display.standardLength;
    const max = new Point(map.width-1, map.height-1).multiply(tileSize);
    this.cameraLead.set(this.cameraLead.clamp(max));
  }

  private updateLastCameraTravelVector(dir: Point) {
    this.lastInput.set(
      (dir.x !== 0) ? dir.x : this.lastInput.x,
      (dir.y !== 0) ? dir.y : this.lastInput.y,
    );
  }

  toPointerPosition(p: Point) {
    const size = Game.display.standardLength;
    this.virtualCursorPos.set(p.multiply(1/size).round());
    this.lastInputWasPointer = true;
    this.cameraLead.set(p);
    this.clampCameraLead(); // I actually don't know or remember why this is necessary, but it prevents bouncy on the map boundaries.
  }

  finalCursorPosition() {
    const { camera } = this.assets;

    const size = Game.display.standardLength;
    const { lastInput } = this;
    const frame = camera.transform.subjectRect();

    // Mouse camera-movements have a different cursor placement mechanism.
    if (this.lastInputWasPointer)
      return this.virtualCursorPos;

    // Picks a truncate style for x based on the directional bias of dx.
    const biasTrunc = (x: number, dx: number) => [Math.floor, Math.round, Math.ceil][Math.sign(dx) + 1](x);

    const topLeft = new Point(frame);
    topLeft.x = biasTrunc(topLeft.x / size, lastInput.x);
    topLeft.y = biasTrunc(topLeft.y / size, lastInput.y);

    const bottomRight = topLeft.add(
      biasTrunc(frame.width / size, -lastInput.x),
      biasTrunc(frame.height / size, -lastInput.y),
    );

    const mapPos = this.virtualCursorPos.clone();
    mapPos.x = [topLeft.x, mapPos.x, bottomRight.x][Math.sign(lastInput.x) + 1];
    mapPos.y = [topLeft.y, mapPos.y, bottomRight.y][Math.sign(lastInput.y) + 1];

    return mapPos;
  }

}