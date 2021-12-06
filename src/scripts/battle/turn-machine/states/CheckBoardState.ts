import { TurnState } from "../TurnState";
import { IssueOrderStart } from "./IssueOrderStart";
import { AnimateEvents } from "./AnimateEvents";

export class CheckBoardState extends TurnState {
  get type() { return CheckBoardState; }
  get name(): string { return "CheckBoardState"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  protected configureScene(): void {
    const { map, players } = this.assets;
    const player = players.current;

    // TODO Check players for win conditions, etc.
    // The purpose here is to check game conditions between orders; if a unit captures
    // the other's HQ, the game should end immediately.
    // 
    // This should split between Animating the player's standby events, which are determined
    // in TurnStart, and moving into some kind of PlayerEnd/Animate state.

    // Per unit inter-player configurations — those which need to happen between unit orders.
    players.allUnits.forEach( unit => {
      if (!unit.onMap)
        return;
      
      const neighbors = map.neighborsAt(unit.boardLocation);
      const square = neighbors.center;
      const terrain = square.terrain;

      // Determine visibility
      const notAllied = (unit.faction !== player.faction);
      const adjacentToAllied = (neighbors.orthogonals.some( s => s.unit && s.unit.faction === player.faction ));
      square.hideUnit = (unit.hiding && notAllied && !adjacentToAllied);
    });

    this.advance(AnimateEvents, IssueOrderStart);
  }

}