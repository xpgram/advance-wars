import { TurnState } from "../TurnState";
import { TurnStart } from "./TurnStart";

export class GameStart extends TurnState {
  get name() { return 'GameStart'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    this.advanceToState(TurnStart);
  }

}