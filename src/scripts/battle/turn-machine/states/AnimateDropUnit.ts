import { TurnState } from "../TurnState";
import { AnimateBattle } from "./AnimateBattle";

export class AnimateDropUnit extends TurnState {
  get name(): string { return "CheckBoardState"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  configureScene(): void {
    this.advanceToState(AnimateBattle);
  }

}