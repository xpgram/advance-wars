import { Square } from "../../map/Square";
import { TurnState } from "../TurnState";


/** Conforms the board to the perspective player's beginning-of-turn state.
 * Primarily handles the hiding/unhiding of units and fog or war tiles. */
export class ResetPerspective extends TurnState {
  get type() { return ResetPerspective; }
  get name() { return 'ResetPerspective'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { map, players, scenario } = this.assets;

    // update FoW
    if (scenario.fogOfWar) {
      // map.every( tile => tile.hiddenFlag = true );
      // players.perspective.units.forEach( unit => {reveal vis} );
      // players.perspective.bases.forEach( base => {reveal vis} );
    }

    // Update unit hidden status
    players.allUnits.forEach( unit => {
      if (!unit.onMap)
        return;
      
      const neighbors = map.neighborsAt(unit.boardLocation);
      const square = neighbors.center;
      const terrain = square.terrain;

      // Determine visibility
      const notAllied = (unit.faction !== players.perspective.faction);

      const adjacentTest = (s: Square) => s.unit?.faction === players.perspective.faction;
      const adjacentToAllied = (neighbors.orthogonals.some( adjacentTest ));

      square.hideUnit = (unit.hiding && notAllied && !adjacentToAllied);
    });

    this.advance();
  }

}