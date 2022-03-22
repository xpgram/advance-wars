import { TurnState } from "../TurnState";
import { Point } from "../../../Common/Point";
import { DamageScript } from "../../DamageScript";
import { RadialPointSelector } from "../../../RadialPointSelector";
import { Game } from "../../../..";

export class ChooseAttackTarget extends TurnState {
  get type() { return ChooseAttackTarget; }
  get name() { return 'ChooseAttackTarget'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  private radialPoints!: RadialPointSelector;

  private triggerCursorMove(p: Point) {
    const { mapCursor } = this.assets;
    mapCursor.moveTo(p);
  }

  updateDamageForecast() {
    const { map, mapCursor, uiSystem, players } = this.assets;
    const { actor, goal, seed } = this.data;

    const focalTile = map.squareAt(mapCursor.boardLocation);
    const focalUnit = focalTile.unit;
    if (focalUnit && focalUnit.faction !== players.current.faction) {
      const damage = DamageScript.NormalAttack(map, actor, goal, focalUnit, seed);
      uiSystem.battleForecast = damage.estimate;
    } else {
      uiSystem.battleForecast = undefined;
    }
  }

  configureScene() {
    const { map, mapCursor, uiSystem, trackCar, gamepad } = this.assets;
    const { actor, goal } = this.data;

    mapCursor.show();
    mapCursor.disable();
    uiSystem.show();
    trackCar.show();

    // Setup map cursor
    mapCursor.on('move', this.updateDamageForecast, this);
    mapCursor.mode = 'target';

    // Build the list of possible targets
    const targets = [];
    const boundary = map.squareOfInfluence(actor);
    for (let yi = 0; yi < boundary.height; yi++)
      for (let xi = 0; xi < boundary.width; xi++) {
        const point = new Point(
          xi + boundary.x,
          yi + boundary.y,
        )
        const square = map.squareAt(point);
        if (square.unit && square.attackFlag)
          targets.push(point);
      }

    // If there are no targets, revert to last state
    if (targets.length == 0)
      this.failTransition(`no attackable targets in range`);

    // Otherwise, setup the target-picker and move the cursor.
    this.radialPoints = new RadialPointSelector({
      gamepad,
      origin: goal,
      points: targets,
      onIncrement: this.triggerCursorMove,
      context: this,
    })

    mapCursor.moveTo(this.radialPoints.current);
  }

  update() {
    const { gamepad, stagePointer, map, mapCursor, instruction } = this.assets;
    const { place } = this.data;

    const { A, B } = gamepad.button;

    // Transition intent flags
    let affirm = false;
    let cancel = false;

    // Mouse controls data
    const tileSize = Game.display.standardLength;
    const pointerBoardLocation = stagePointer.pointerLocation().apply(n => Math.floor(n/tileSize));
    const tile = map.squareAt(pointerBoardLocation);

    const pointerOverCursor = pointerBoardLocation.equal(mapCursor.boardLocation);

    // Mouse logic
    if (stagePointer.clicked()) {
      if (tile.attackFlag) {
        if (!pointerOverCursor) {
          this.radialPoints.setIndexToPoint(pointerBoardLocation);
        } else
          affirm = true;
      }
      else
        cancel = true;
    }

    // Gamepad logic
    if (A.pressed)
      affirm = true;
    if (B.pressed)
      cancel = true;

    // Handle transition intent
    if (cancel)
      this.regress();
    else if (affirm) {
      instruction.focal = this.radialPoints.current;
      this.advance();
    }
  }

  close() {
    const { mapCursor, uiSystem } = this.assets;

    this.radialPoints.destroy();
    uiSystem.battleForecast = undefined;
    mapCursor.removeListener(this.updateDamageForecast, this);
  }

  prev() {
    const { mapCursor, instruction } = this.assets;
    const { goal } = this.data;
    instruction.focal = undefined;
    mapCursor.moveTo(goal);
  }
  
}