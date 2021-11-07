import { TurnState } from "../TurnState";
import { IssueOrderStart } from "./IssueOrderStart";
import { AnimateStandbyEvents } from "./AnimateStandbyEvents";

export class CheckBoardState extends TurnState {
  get name(): string { return "CheckBoardState"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  protected configureScene(): void {
    // TODO Check players for win conditions, etc.
    // The purpose here is to check game conditions between orders; if a unit captures
    // the other's HQ, the game should end immediately.
    // 
    // This should split between Animating the player's standby events, which are determined
    // in TurnStart, and moving into some kind of PlayerEnd/Animate state.

    this.advanceToState(AnimateStandbyEvents);
  }

}