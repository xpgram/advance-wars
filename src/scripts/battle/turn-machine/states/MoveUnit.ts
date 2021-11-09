import { TurnState } from "../TurnState";
import { Point } from "../../../Common/Point";
import { CommandMenu } from "./CommandMenu";

export class MoveUnit extends TurnState {
  get name() { return 'MoveUnit'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  private lastCursorPos = new Point(-1, -1);

  configureScene() {
    const { map, mapCursor, uiSystem, trackCar } = this.assets;
    const { actor, placeTile } = this.data;

    mapCursor.show();
    uiSystem.show();

    // Hide unit's map sprite
    placeTile.hideUnit = true;

    // Show the unit's trackcar
    trackCar.buildNewAnimation(actor);
    trackCar.show();

    // Generate movement map
    map.generateMovementMap(actor);
  }

  update() {
    const { map, mapCursor, gamepad, players, instruction } = this.assets;
    const { actor, place } = this.data;

    // On press B, revert state
    if (gamepad.button.B.pressed)
      this.regressToPreviousState();

    // If the unit is not owned by current player, do nothing else
    if (players.current.faction !== actor.faction)
      return;

    // Request a recalc of the travel path on cursor move
    if (this.lastCursorPos.notEqual(mapCursor.pos)) {
      this.lastCursorPos = new Point(mapCursor.pos);
      map.recalculatePathToPoint(actor, this.lastCursorPos);
    }

    // On press A and viable location, advance state
    else if (gamepad.button.A.pressed) {
      const square = map.squareAt(this.lastCursorPos);
      const underneath = square.unit;

      const moveable = square.moveFlag;
      const occupiable = square.occupiable(actor);
      const mergeable = (underneath?.type === actor.type
        && underneath?.faction === actor.faction);
      const boardable = underneath?.boardable(actor);

      // Final check
      if (moveable && (occupiable || mergeable || boardable)) {
        instruction.path = map.pathFrom(place);
        this.advanceToState(CommandMenu);
      }
    }
  }

  prev() {
    const { map, mapCursor, trackCar } = this.assets;
    const { place, placeTile } = this.data;

    placeTile.hideUnit = false;
    trackCar.hide();
    map.clearMovementMap();
    mapCursor.moveTo(place);
  }

}