import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";
import { Command, getCommandObject } from "../Command";
import { AnimateEvents } from "./AnimateEvents";
import { SpendActorEvent } from "../../map/tile-effects/SpendActorEvent";

export class RatifyIssuedOrder extends TurnState {
  get type() { return RatifyIssuedOrder; }
  get name(): string { return "RatifyIssuedOrder"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  protected advanceStates = {
    checkBoardState: { state: CheckBoardState, pre: () => { } },
  }

  protected configureScene(): void {
    const { instruction, map, players, trackCar, boardEvents } = this.assets;
    const { action, placeTile } = this.data;

    map.clearMovementMap();           // Remnant from turnstate ingress.
    placeTile.hideUnit = false;       // Automatic, but not when unit doesn't move.
    // trackCar.reset();                 // TODO Doesn't this get built again right after? By the Command.Move event.

    // Retrieve and execute command
    const command = getCommandObject(action);
    command.scheduleEvents();

    Command.Drop.scheduleEvents();

    if (placeTile.unit && command.spendsUnit) {
      const actor = placeTile.unit;
      const location = this.data.goal;
      boardEvents.schedule(new SpendActorEvent({actor, location}));
    }

    // Update cursor position.
    if (instruction.path) {
      const { goal } = this.data;
      this.assets.mapCursor.teleport(goal);
    }

    // Advance to next state.
    this.advance(AnimateEvents, CheckBoardState);
  }

}