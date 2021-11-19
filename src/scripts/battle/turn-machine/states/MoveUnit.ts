import { TurnState } from "../TurnState";
import { Point } from "../../../Common/Point";

export class MoveUnit extends TurnState {
  get type() { return MoveUnit; }
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
      this.regress();

    // If the unit is not owned by current player, do nothing else
    if (players.current.faction !== actor.faction)
      return;

    // Request a recalc of the travel path on cursor move
    if (this.lastCursorPos.notEqual(mapCursor.pos)) {
      this.lastCursorPos = mapCursor.pos;
      map.recalculatePathToPoint(actor, mapCursor.pos);
    }

    // On press A and viable location, advance state
    else if (gamepad.button.A.pressed) {
      const square = map.squareAt(mapCursor.pos);
      const underneath = square.unit;

      // TODO Some of this is the same as Join.trigger() and other commands.
      // Wouldn't it be nice if I could just ask "Will there be any commands here?"

      const moveable = square.moveFlag;
      const occupiable = square.occupiable(actor);
      const mergeable = (underneath?.type === actor.type
        && underneath?.faction === actor.faction
        && (underneath?.repairable || actor.repairable));
      const boardable = underneath?.boardable(actor);

      // Final check
      if (moveable && (occupiable || mergeable || boardable)) {
        instruction.path = map.pathFrom(place);
        this.advance();
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