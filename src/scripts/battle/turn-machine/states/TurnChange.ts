import { TurnState } from "../TurnState";
import { TurnStart } from "./TurnStart";

export class TurnChange extends TurnState {
  get name() { return 'TurnChange'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { players, uiSystem } = this.assets;

    players.increment();
    uiSystem.updatePlayerWindowOrder();

    // TODO Rebind controller? BoardPlayer probably should know which input its listening from.
    // TODO gamepad should be gotten from players.current, yeah? That would be cool. I think.

    this.advanceToState(TurnStart);
  }

}