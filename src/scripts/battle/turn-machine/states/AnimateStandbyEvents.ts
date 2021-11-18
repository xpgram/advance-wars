import { TurnState } from "../TurnState";

export class AnimateStandbyEvents extends TurnState {
  get type() { return AnimateStandbyEvents; }
  get name(): string { return "CheckBoardState"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  configureScene(): void {
    this.advance();
  }
  
}