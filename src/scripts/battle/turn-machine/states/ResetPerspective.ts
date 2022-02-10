import { Point } from "../../../Common/Point";
import { Square } from "../../map/Square";
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

    function revealRegion(loc: Point, region: RegionMap) {
      region.points.forEach( p => {
        const tilePoint = loc.add(p);
        if (!map.validPoint(tilePoint))
          return;

        const tile = map.squareAt(tilePoint);
        const deepSight = (loc.manhattanDistance(tilePoint) <= 1)
          || players.perspective.officer.CoPowerInEffect; // TODO Which, specifically
        const revealable = !tile.terrain.conceals || deepSight;
        if (revealable)
          tile.hiddenFlag = false;
      });
    }

    // update FoW
    if (scenario.fogOfWar) {
      for (let x = 0; x < map.width; x++)
      for (let y = 0; y < map.height; y++)
        map.squareAt({x,y}).hiddenFlag = true;

      // TODO Include shared sight maps

      // Reveal vis from allied units
      // if scenario.sharedSightMap include players.sameTeam(players.perspective)?
      players.perspective.units.forEach( unit => {
        const visRegion = CommonRangesRetriever({min: 0, max: unit.vision});
        revealRegion(unit.boardLocation, visRegion);
      });

      // Reveal vis from allied bases
      // if scenario.sharedSightMap include players.sameTeam(players.perspective)?
      players.perspective.capturePoints.forEach( loc => {
        const tile = map.squareAt(loc);
        const visRegion = CommonRangesRetriever({min: 0, max: tile.terrain.vision});
        revealRegion(loc, visRegion);
      });
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