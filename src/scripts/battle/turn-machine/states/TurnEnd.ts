import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { TurnState } from "../TurnState";
import { TurnChange } from "./TurnChange";

export class TurnEnd extends TurnState {
  get type() { return TurnEnd; }
  get name() { return 'TurnEnd'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { mapCursor, players } = this.assets;
    const player = players.current;

    // Emit turn-change signal if this is the client who issued it.
    if (players.perspectivesTurn) {
      Game.online.io.emit('turn change', undefined);
    }

    player.units.forEach(u => {
      u.spent = false;
      u.orderable = false;
      u.CoCouldBoard = false;
    });
    player.lastCursorPosition = new Point(mapCursor.boardLocation);
    this.advance(TurnChange);
  }

}