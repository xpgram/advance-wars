import { Game } from "../../../..";
import { TurnState } from "../TurnState";
import { TurnStart } from "./TurnStart";

export class TurnChange extends TurnState {
  get type() { return TurnChange; }
  get name() { return 'TurnChange'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { players, uiSystem } = this.assets;

    // Find the next active player — do not loop infinitely; include a hard limit
    for (let i = 0; i < players.all.length; i++) {
      players.increment();
      if (players.current.defeated === false)
        break;
    }

    uiSystem.updatePlayerWindowOrder();

    // TODO Rebind controller? BoardPlayer probably should know which input its listening from.
    // TODO gamepad should be gotten from players.current, yeah? That would be cool. I think.

    this.advance(TurnStart);
  }

}