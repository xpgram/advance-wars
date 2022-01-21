import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";
import { ResetPerspective } from "./ResetPerspective";
import { PlayerCard } from "./PlayerCard";
import { StandbyPhase } from "./StandbyPhase";
import { ConfirmPlayerPresence } from "./ConfirmPlayerPresence";

/** Handles player beginning-of-turn asset configurations and schedules
 * pre-turn phases. */
export class TurnStart extends TurnState {
  get type() { return TurnStart; }
  get name() { return 'TurnStart'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { mapCursor, uiSystem, players, scripts, } = this.assets;
    const player = players.current;

    // Move Cursor
    mapCursor.teleport(player.lastCursorPosition);

    // Move UI Windows
    uiSystem.skipAnimations();
    uiSystem.setDayCounter(players.day);

    // Configure initial control script states
    scripts.nextOrderableUnit.resetIndex();
  }

  update() {
    // update() waits for camera, then this advances
    this.advance(
      ConfirmPlayerPresence, ResetPerspective, PlayerCard, StandbyPhase, CheckBoardState
    );
  }

}