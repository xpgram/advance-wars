import { Game } from "../../../..";
import { Keys } from "../../../controls/KeyboardObserver";
import { Faction } from "../../EnumTypes";
import { DestructEvent } from "../../map/tile-effects/DestructEvent";
import { TurnState } from "../TurnState";
import { AnimateEvents } from "./AnimateEvents";
import { GameLose } from "./GameLose";
import { GameWin } from "./GameWin";
import { IssueOrderStart } from "./IssueOrderStart";

/** A TurnState which confirms player loss/win state.
 * It splits logical order between the beginning of a new IssueOrder and 
 * the win/lose animation states. */
export class CheckBoardState extends TurnState {
  // TODO Rename to CheckPlayerState?   : Player lose status.
  // TODO Introduce CheckWarState?      : Global game over/not-over status.
  // The distinction is between 2P and 3P+ games. Players can lose before
  // the match is over.
  get type() { return CheckBoardState; }
  get name(): string { return "CheckBoardState"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  protected configureScene(): void {
    const { map, players, boardEvents, trackCar } = this.assets;

    // Update property count in case HQ was captured
    players.all.forEach(player => player.scanCapturedProperties());

    if (players.playerWon(players.perspective)) {
      this.advance(GameWin, IssueOrderStart);
      return;
    }

    if (players.playerLost(players.perspective)) {
      this.advance(GameLose, IssueOrderStart);
      return;
    }

    // Schedule events for defeated players.
    // TODO Should I just pass into a PlayerLost turnstate?
    // I would need to specify which; I haven't really codified the
    // turnstate argument system yet.
    players.all.forEach( p => {
      if (!p.defeated)
        return;

      // Schedule unit destruction
      p.units.forEach( u => boardEvents.schedule(
        new DestructEvent({
          assets: this.assets,
          unit: u,
          trackCar
        })
      ))

      // Uncapture all properties
      p.capturePoints.forEach( point => {
        map.squareAt(point).terrain.faction = Faction.Neutral;
      })

      // TODO Convert HQ into city tile; retain faction if not self
      // TODO But don't do that if scenario allows for +1 multiple HQs.
    })

    // PlayerDefeated event where DestructEvents will be handled but
    // a 'Player Defeated' card is also shown and properties are uncaptured.
    this.advance(AnimateEvents, IssueOrderStart);
  }

}