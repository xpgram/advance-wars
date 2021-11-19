import { TurnState } from "../TurnState";

export class AnimateStandbyEvents extends TurnState {
  get type() { return AnimateStandbyEvents; }
  get name(): string { return "AnimateStandbyEvents"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  configureScene(): void {
    this.advance();
  }
  
}