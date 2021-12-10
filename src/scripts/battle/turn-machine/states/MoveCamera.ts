import { TurnState } from "../TurnState";
import { TransformContainer } from "../../../CommonTypes";
import { Point } from "../../../Common/Point";
import { Game } from "../../../..";
import { Common } from "../../../CommonUtils";

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
    const { gamepad } = this.assets;

    // On release B, revert to previous state.
    if (gamepad.button.B.up)
      this.regress();
  }

  prev(): void {
    const { camera, mapCursor, uiSystem, scripts } = this.assets;

    const size = Game.display.standardLength;
    const lastInput = scripts.manualMoveCamera.lastInput;

    // Move mapCursor somewhere appropriate
    if (lastInput.notEqual(Point.Origin)) {
      const frame = camera.viewFrame;

      // .add() extra padding as well (bandaid the snapping)
      const topLeft = new Point(frame);
      const bottomRight = topLeft.add(frame.width, frame.height).subtract(size, size);

      const worldPos = mapCursor.transform.pos.clone();
      if (lastInput.x !== 0)
        worldPos.x = (lastInput.x < 0) ? topLeft.x : bottomRight.x;
      if (lastInput.y !== 0)
        worldPos.y = (lastInput.y < 0) ? topLeft.y : bottomRight.y;

      const mapPos = worldPos.multiply(1 / size).floor();

      mapCursor.teleport(mapPos);
    }

    // Fix UI after cursor movement.
    uiSystem.skipAnimations();
  }

}
