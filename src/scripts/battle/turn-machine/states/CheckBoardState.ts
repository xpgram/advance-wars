import { Game } from "../../../..";
import { Keys } from "../../../controls/KeyboardObserver";
import { Debug } from "../../../DebugUtils";
import { Faction } from "../../EnumTypes";
import { DestructEvent } from "../../map/tile-effects/DestructEvent";
import { TurnState } from "../TurnState";
import { AnimateEvents } from "./AnimateEvents";
import { GameLose } from "./GameLose";
import { GameWin } from "./GameWin";
import { IssueOrderStart } from "./IssueOrderStart";
import { TurnEnd } from "./TurnEnd";
import { WaitForNextInstruction } from "./WaitForNextInstruction";

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

    const playersLog = players.all.map( p => p.logString() ).join('\n');
    Debug.log(this.name, `VerifyPlayers`, {
      message: `Checking win status for ${players.playersStillActive} active players.\n${playersLog}`,
    });

    if (players.playerWon(players.perspective)) {
      this.advance(GameWin, IssueOrderStart);
      return;
    }
    
    if (players.winnerFound()) {
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

      // TODO This doesn't need to run on already demolished players
      // TODO Actually, I think capturePoints might even prevent still-active players from
      // capturing demolished player's previously held properties.

      // Schedule unit destruction
      p.unitsOnMap.forEach( u => boardEvents.schedule(
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
      // TODO If scenario captures all bases on HQ capture, do it
      // TODO Make sure captured bases also affect sight map during FoW
    })

    // PlayerDefeated event where DestructEvents will be handled but
    // a 'Player Defeated' card is also shown and properties are uncaptured.
    if (!players.current.defeated) {
      const IdleState = (players.perspectivesTurn) ? IssueOrderStart : WaitForNextInstruction;
      this.advance(AnimateEvents, IdleState);
    } else
      this.advance(TurnEnd);
  }

}