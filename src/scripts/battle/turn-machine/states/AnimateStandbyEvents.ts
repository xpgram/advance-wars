import { TurnState } from "../TurnState";
import { IssueOrderStart } from "./IssueOrderStart";

export class AnimateStandbyEvents extends TurnState {
  get name(): string { return "CheckBoardState"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  configureScene(): void {
    this.advanceToState(IssueOrderStart);
  }
  
}