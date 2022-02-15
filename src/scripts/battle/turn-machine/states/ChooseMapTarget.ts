import { CommonRangesRetriever } from "../../unit-actions/RegionMap";
import { TurnState } from "../TurnState";


export class ChooseMapTarget extends TurnState {
  get type() { return ChooseMapTarget; }
  get name() { return 'ChooseMapTarget'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  private mustSelectTargetable = false;

  onRegress() {
    // Use private RegionMap?
    // Do we assume this on construction and always use? That would be simple.
  }
  
  configureScene() {
    const { map, mapCursor } = this.assets;
    const { place, placeTile } = this.data;

    const range = placeTile.unit?.range.max;

    // If given a range RegionMap, apply targetable=true around map(place)
    // If not, anywhere is selectable

    if (range) {
      const rangeMap = CommonRangesRetriever({min:0, max:range});
      rangeMap.points.forEach( p => {
        map.squareAt(p.add(place)).targetFlag = true;
      })
      this.mustSelectTargetable = true;
    }

    // Get AoE RegionMap. ... From where?
    // This is map cursor boundary.
    const areaMap = CommonRangesRetriever({min:0, max:3});
    mapCursor.areaOfEffectMap = areaMap;
  }

  update() {
    const { gamepad, map, mapCursor, instruction } = this.assets;

    const { A, B } = gamepad.button;

    if (B.pressed)
      this.regress();
    else if (A.pressed) {
      if (!this.mustSelectTargetable || map.squareAt(mapCursor.boardLocation).targetFlag) {
        instruction.focal = mapCursor.boardLocation;
        this.advance();
      }
    }
  }

  close() {
    const { map, mapCursor } = this.assets;
    map.squares.forEach( s => s.targetFlag = false );
    mapCursor.areaOfEffectMap = undefined;
  }
}