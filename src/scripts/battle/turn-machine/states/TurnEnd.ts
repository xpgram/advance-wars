import { Point } from "../../../Common/Point";
import { TurnState } from "../TurnState";
import { TurnChange } from "./TurnChange";

export class TurnEnd extends TurnState {
  get name() { return 'TurnEnd'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { mapCursor } = this.assets;
    const player = this.assets.players.current;

    player.units.forEach(u => {
      u.spent = false;
      u.orderable = false;
    });
    player.lastCursorPosition = new Point(mapCursor.pos);
    this.advanceToState(TurnChange);
  }

}