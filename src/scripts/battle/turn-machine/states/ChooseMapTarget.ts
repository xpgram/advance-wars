import { CommonRangesRetriever } from "../../unit-actions/RegionMap";
import { CommandHelpers } from "../Command.helpers";
import { TurnState } from "../TurnState";

export class ChooseMapTarget extends TurnState {
  get type() { return ChooseMapTarget; }
  get name() { return 'ChooseMapTarget'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  private mustSelectTargetable = false;

  private updateCursorUI() {
    const { map, mapCursor } = this.assets;
    const alwaysTarget = !this.mustSelectTargetable;
    const overTargetable = map.squareAt(mapCursor.boardLocation).targetFlag;
    const show = (alwaysTarget || overTargetable);
    mapCursor.mode = (show) ? 'target' : 'point';
    mapCursor.showAreaOfEffectMap = (show);
  }
  
  configureScene() {
    const { map, mapCursor, trackCar, scripts } = this.assets;
    const { action, place } = this.data;

    map.clearTileOverlay();
    mapCursor.show();
    trackCar.show();

    scripts.stagePointerInterface.enable();

    const cmd = CommandHelpers.getCommandObject(action) as CommandHelpers.UniqueStats;

    mapCursor.regionMap = cmd.effectAreaMap;

    if (cmd.range) {
      const rangeMap = CommonRangesRetriever(cmd.range);
      map.squaresFrom(place, rangeMap).forEach( s => s.targetFlag = true );
      this.mustSelectTargetable = true;
    }

    // Define mapcursor mode behavior
    mapCursor.on('move', this.updateCursorUI, this)
    this.updateCursorUI();  // First setup call
  }

  update() {
    const { gamepad, map, mapCursor, instruction } = this.assets;
    const { stagePointerInterface: pointer } = this.assets.scripts;

    const { A, B } = gamepad.button;

    if (B.pressed)
      this.regress();
    else if (A.pressed || pointer.affirmIntent) {
      if (!this.mustSelectTargetable || map.squareAt(mapCursor.boardLocation).targetFlag) {
        instruction.focal = mapCursor.boardLocation;
        this.advance();
      }
      else if (pointer.affirmIntent) {  // Pointer-style cancel
        this.regress();
      }
    }
  }

  close() {
    const { mapCursor } = this.assets;
    mapCursor.removeListener(this.updateCursorUI, this);
  }

}