import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";
import { Command, getCommandObject } from "../Command";
import { AnimateOrder } from "./AnimateOrder";

export class RatifyIssuedOrder extends TurnState {
  get type() { return RatifyIssuedOrder; }
  get name(): string { return "RatifyIssuedOrder"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  protected advanceStates = {
    checkBoardState: { state: CheckBoardState, pre: () => { } },
  }

  protected configureScene(): void {
    const { instruction, trackCar } = this.assets;
    const { action, placeTile } = this.data;

    // Revert settings set from TrackCar.
    // TODO If a tile does not hold a unit, it should auto-unhide.
    // I think this statement would still be necessary for no movement, however.
    placeTile.hideUnit = false;
    trackCar.reset();

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
    this.advance(AnimateOrder, CheckBoardState);
  }

}