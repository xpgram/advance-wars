import { Game } from "../../../..";
import { TurnState } from "../TurnState";


export class EmitEvents extends TurnState {
  get type() { return EmitEvents; }
  get name(): string { return "EmitEvents"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return true; }

  protected configureScene(): void {
    const { instruction, players } = this.assets;

    // TODO Check: Game is online?
    // TODO Check: Player number matches? That should also be an assertion, maybe.

    Game.online.io.emit('troop order', instruction);  // Online test

    // TODO Alternatively... I think I need to refactor TurnState to use the generic state machine,
    // but I could simply pass into Ratify whether it should emit or not, by default it would.
    // This would prevent me from needing to make sure every Ratify is preceeded by an Emit.

    this.advance();
  }

}