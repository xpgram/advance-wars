import { TurnState } from "../TurnState";
import { TransformContainer } from "../../../CommonTypes";
import { Point } from "../../../Common/Point";
import { Game } from "../../../..";
import { Common } from "../../../CommonUtils";
import { Unit } from "../../Unit";

const CAMERA_SPEED = 7;     // How many tiles the camera travels per 60 frames.

export class MoveCamera extends TurnState {
  get type() { return MoveCamera; }
  get name(): string { return "MoveCamera"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  private followTargetSwap!: TransformContainer | Point | null;
  private lastMoveDir = new Point();  // The last axis input to the camera driver.

  configureScene(): void {
    const { gamepad, camera } = this.assets;

    // Fade units to reveal map
    if (gamepad.button.leftTrigger.up)
      this.setUnitTransparency();

    // Save old camera configuration — disable the camera's follow algorithm
    this.followTargetSwap = camera.followTarget;
    camera.followTarget = null;
  }

  update(): void {
    const { camera, map, gamepad } = this.assets;

    // On release B, revert to previous state.
    if (gamepad.button.B.up)
      this.regress();

    // Otherwise, move the camera according to movement axis.
    else {
      // Get directional axis
      const dirPoint = gamepad.axis.dpad.point;

      // Update last axis input if any were given.
      if (dirPoint.x != 0) this.lastMoveDir.x = dirPoint.x;
      if (dirPoint.y != 0) this.lastMoveDir.y = dirPoint.y;

      // Correct diagonal distance to some line of length ~1.
      if (Math.abs(dirPoint.x) == Math.abs(dirPoint.y)) {
        dirPoint.x *= .71;  // Ratio of 1 to sqrt(2)
        dirPoint.y *= .71;
      }

      // Adjust axis by intended camera speed
      dirPoint.x *= CAMERA_SPEED;
      dirPoint.y *= CAMERA_SPEED;

      // Move the camera
      camera.x += dirPoint.x;
      camera.y += dirPoint.y;

      // Confine the camera to the map space
      const size = Game.display.standardLength;
      const min = new Point();
      const max = new Point(map.width * size, map.height * size);

      min.x -= camera.frameBorder.x;
      min.y -= camera.frameBorder.y;
      max.x -= camera.frameBorder.width;
      max.y -= camera.frameBorder.height;

      camera.x = Common.clamp(camera.x, min.x, max.x);
      camera.y = Common.clamp(camera.y, min.y, max.y);
    }

    // Allow triggers to reveal units during camera movement.
    const { leftTrigger, rightTrigger } = gamepad.button;
    if (leftTrigger.changed || rightTrigger.changed)
      this.setUnitTransparency();
  }

  prev(): void {
    const { camera, mapCursor, uiSystem } = this.assets;

    const size = Game.display.standardLength;

    // Opaquify units to resume gameplay
    this.setUnitTransparency(true);

    // Move mapCursor somewhere appropriate
    // TODO Camera view border should be extracted from camera itself.
    if (this.lastMoveDir.notEqual(Point.Origin)) {
      // x-coord placement set to cursor or camera view edge
      let x = mapCursor.transform.x;
      if (this.lastMoveDir.x < 0) x = camera.x + 3 * size;
      if (this.lastMoveDir.x > 0) x = camera.x + camera.width - 4 * size;

      // y-coord placement set to cursor or camera view edge
      let y = mapCursor.transform.y;
      if (this.lastMoveDir.y < 0) y = camera.y + 2 * size;
      if (this.lastMoveDir.y > 0) y = camera.y + camera.height - 3 * size;

      // Pare down values to board coordinates
      let place = new Point(
        Math.floor(x / size),
        Math.floor(y / size)
      );

      // Final move order
      mapCursor.teleport(place);
    }

    // Reconfigure old camera
    camera.followTarget = this.followTargetSwap;

    // Fix UI after cursor movement.
    uiSystem.skipAnimations();
  }

  /** Sets all units' transparency flag to the given value. */
  private setUnitTransparency(show: boolean = false) {
    const { gamepad, allInPlayUnits, players } = this.assets;
    const player = players.current;

    const showUnits = (gamepad.button.leftTrigger.down);
    const showStatusUnits = (gamepad.button.rightTrigger.down);

    allInPlayUnits.forEach( unit => {
      const statusUnit = unit.faction === player.faction && unit.statusApplied;
      unit.transparent = !show && !showUnits && !(showStatusUnits && statusUnit);
    });
  }
}