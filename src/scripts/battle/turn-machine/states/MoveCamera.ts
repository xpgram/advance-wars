import { TurnState } from "../TurnState";
import { Point } from "../../../Common/Point";
import { Game } from "../../../..";

const CAMERA_SPEED = 7;     // How many tiles the camera travels per 60 frames.

// TODO Use manualMoveCamera and hideUnit
// TODO Use manualMoveCamera.lastInput to place UI and map cursor.

export class MoveCamera extends TurnState {
  get type() { return MoveCamera; }
  get name(): string { return "MoveCamera"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  configureScene(): void {
    const { scripts } = this.assets;
    scripts.hideUnits.enable();
    scripts.manualMoveCamera.enable();
  }

  update(): void {
    const { gamepad, camera, scripts } = this.assets;

    // On release B, revert to previous state.
    if (gamepad.button.B.up) {
      scripts.manualMoveCamera.disable();
      this.regress();
    }
  }

  close(): void {
    const { camera, mapCursor, uiSystem, scripts } = this.assets;

    const size = Game.display.standardLength;
    const lastInput = scripts.manualMoveCamera.lastInput;

    // Move mapCursor somewhere convenient
    if (lastInput.notEqual(Point.Origin)) {
      const frame = camera.targetTransform.subjectRect();

      // Picks a truncate style for x based on the directional bias of dx.
      const biasTrunc = (x: number, dx: number) => [Math.floor, Math.round, Math.ceil][Math.sign(dx) + 1](x);

      const topLeft = new Point(frame);
      topLeft.x = biasTrunc(topLeft.x / size, lastInput.x);
      topLeft.y = biasTrunc(topLeft.y / size, lastInput.y);

      const bottomRight = topLeft.add(
        biasTrunc(frame.width / size, -lastInput.x),
        biasTrunc(frame.height / size, -lastInput.y),
      );

      const mapPos = mapCursor.pos.clone();
      mapPos.x = [topLeft.x, mapPos.x, bottomRight.x][Math.sign(lastInput.x) + 1];
      mapPos.y = [topLeft.y, mapPos.y, bottomRight.y][Math.sign(lastInput.y) + 1];

      mapCursor.teleport(mapPos);
    }

    // Fix UI after cursor movement.
    uiSystem.skipAnimations();
  }

}
