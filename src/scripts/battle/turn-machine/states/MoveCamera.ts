import { TurnState } from "../TurnState";
import { Point } from "../../../Common/Point";
import { Game } from "../../../..";


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
    const { mapCursor, uiSystem, scripts } = this.assets;
    mapCursor.teleportTo(scripts.manualMoveCamera.finalCursorPosition());
    uiSystem.skipAnimations();
  }

}
