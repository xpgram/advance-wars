import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";
import { getCommandObject } from "../Command";

export class RatifyIssuedOrder extends TurnState {
  get name(): string { return "RatifyIssuedOrder"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  protected advanceStates = {
    checkBoardState: { state: CheckBoardState, pre: () => { } },
  }

  protected configureScene(): void {
    const { map, instruction } = this.assets;
    const { action, placeTile } = this.data;

    const tileEmpty = (!placeTile.unit);

    // Revert settings set from TrackCar.
    placeTile.hideUnit = false;

    // Retrieve and execute command
    const command = getCommandObject(action);
    command.ratify();

    // Drop units // TODO bad implementation; doesn't make use of Drop.ratify()
    if (!tileEmpty) {
      const { actor } = this.data;

      this.data.drop
        .sort( (a,b) => b.which - a.which )
        .forEach( d => {
          const { which, where } = d;
          const unit = actor.unloadUnit(which);
          map.placeUnit(unit, where);
          unit.spent = true;
        });
    }

    // Update cursor position.
    if (instruction.path) {
      const { goal } = this.data;
      this.assets.mapCursor.teleport(goal);
    }

    // Advance to next state.
    this.advanceToState(CheckBoardState);
  }

}