import { Game } from "../../../..";
import { Keys } from "../../../controls/KeyboardObserver";
import { TurnState } from "../TurnState";
import { GameLose } from "./GameLose";
import { GameWin } from "./GameWin";
import { IssueOrderStart } from "./IssueOrderStart";

/** A TurnState which confirms player loss/win state.
 * It splits logical order between the beginning of a new IssueOrder and 
 * the win/lose animation states. */
export class CheckBoardState extends TurnState {
  // TODO Rename to CheckPlayerState?   : Player lose status.
  // TODO Introduce CheckWarState?      : Global game over/not-over status.
  // The distinction is between 2P and 3P+ games. Players can lose before
  // the match is over.
  get type() { return CheckBoardState; }
  get name(): string { return "CheckBoardState"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  protected configureScene(): void {
    const { players } = this.assets;

    // TODO Check players for win conditions, etc.
    // The purpose here is to check game conditions between orders; if a unit captures
    // the other's HQ, the game should end immediately.

    // Update property count in case HQ was captured
    players.all.forEach(player => player.scanCapturedProperties());

    if (players.playerWon(players.perspective)) {
      this.advance(GameWin, IssueOrderStart);
      return;
    }

    if (players.playerLost(players.perspective)) {
      this.advance(GameLose, IssueOrderStart);
      return;
    }

    this.advance(IssueOrderStart);
  }

}