import { Point } from "../../../Common/Point";
import { Square } from "../../map/Square";
import { Terrain } from "../../map/Terrain";
import { CommonRangesRetriever, RegionMap } from "../../unit-actions/RegionMap";
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
      for (let x = 0; x < map.width; x++)
      for (let y = 0; y < map.height; y++)
        map.squareAt({x,y}).hiddenFlag = true;

      // TODO Include shared sight maps

      // Reveal vis from allied units
      // if scenario.sharedSightMap include players.sameTeam(players.perspective)?
      players.perspective.unitsOnMap.forEach( unit => {
        map.revealSightMapLocation(unit.boardLocation, players.perspective, unit);
      });

      // Reveal vis from allied bases
      // if scenario.sharedSightMap include players.sameTeam(players.perspective)?
      players.perspective.capturePoints.forEach( loc => {
        map.revealSightMapLocation(loc, players.perspective);
      });

      // Reveal from special terrain
      for (let x = 0; x < map.width; x++)
      for (let y = 0; y < map.height; y++) {
        if (map.squareAt({x,y}).terrain.type === Terrain.Fire)
          map.revealSightMapLocation(new Point(x,y), players.perspective);
      }
    }

    // Update unit hidden status
    players.allUnitsOnMap.forEach( unit => {
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