import { TurnState } from "../TurnState";

export class AnimateBattle extends TurnState {
  get type() { return AnimateBattle; }
  get name(): string { return "AnimateBattle"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  configureScene(): void {
    this.advance();
  }

}