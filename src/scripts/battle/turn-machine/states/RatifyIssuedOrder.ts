import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";
import { Command, getCommandObject } from "../Command";

export class RatifyIssuedOrder extends TurnState {
  get name(): string { return "RatifyIssuedOrder"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  protected advanceStates = {
    checkBoardState: { state: CheckBoardState, pre: () => { } },
  }

  protected configureScene(): void {
    const { instruction } = this.assets;
    const { action, placeTile } = this.data;

    // Revert settings set from TrackCar.
    placeTile.hideUnit = false;

    // Retrieve and execute command
    const command = getCommandObject(action);
    command.ratify();

    Command.Drop.ratify();

    // Update cursor position.
    if (instruction.path) {
      const { goal } = this.data;
      this.assets.mapCursor.teleport(goal);
    }

    // Advance to next state.
    this.advanceToState(CheckBoardState);
  }

}