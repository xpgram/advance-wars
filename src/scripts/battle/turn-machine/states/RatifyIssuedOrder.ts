import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";
import { Command } from "../Command";
import { AnimateEvents } from "./AnimateEvents";
import { SpendActorEvent } from "../../map/tile-effects/SpendActorEvent";
import { CommandHelpers } from "../Command.helpers";
import { Game } from "../../../..";

export class RatifyIssuedOrder extends TurnState {
  get type() { return RatifyIssuedOrder; }
  get name(): string { return "RatifyIssuedOrder"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }


  protected configureScene(): void {
    const { instruction, map, boardEvents, players, multiplayer } = this.assets;
    const { action, placeTile } = this.data;

    if (players.perspectivesTurn) {
      multiplayer.io.emit('TroopOrder', instruction);
    }

    map.clearMovementMap();           // Clean up leftovers from UX ingress.
    placeTile.hideUnit = false;       // Another leftover by TrackCar implementation.

    // Retrieve and execute command
    const command = CommandHelpers.getCommandObject(action);
    CommandHelpers.scheduleEvents(command);

    if (placeTile.unit && command.spendsUnit) {
      const actor = placeTile.unit;
      const location = this.data.goal;
      boardEvents.schedule(new SpendActorEvent({actor, location}));
    }

    // Update cursor position.
    if (instruction.path) {
      const { goal } = this.data;
      this.assets.mapCursor.teleportTo(goal);
    }

    // Advance to next state.
    this.advance(AnimateEvents, CheckBoardState);
  }

}