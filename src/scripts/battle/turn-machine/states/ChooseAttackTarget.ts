import { TurnState } from "../TurnState";
import { Point } from "../../../Common/Point";
import { DamageScript } from "../../DamageScript";
import { RadialPointSelector } from "../../../RadialPointSelector";
import { Game } from "../../../..";
import { CardinalDirection, CardinalVector } from "../../../Common/CardinalDirection";

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
    } else if (!focalUnit && focalTile.terrain.damageable) {
      const damage = DamageScript.TerrainAttack(map, actor, goal, focalTile.terrain, seed);
      uiSystem.battleForecast = damage.estimate;
    } else {
      uiSystem.battleForecast = undefined;
    }
  }

  configureScene() {
    const { map, mapCursor, uiSystem, trackCar, gamepad, scripts } = this.assets;
    const { actor, path, goal } = this.data;

    mapCursor.show();
    mapCursor.disable();
    uiSystem.show();
    trackCar.show();

    // Setup pointer controls
    scripts.stagePointerInterface.enable();
    scripts.stagePointerInterface.mode = 'highlighted';
    scripts.stagePointerInterface.onMoveCursor = (location) => {
      this.radialPoints.setIndexToPoint(location);
    }

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
        if ((square.unit || square.terrain.damageable) && square.attackFlag)
          targets.push(point);
      }

    // If there are no targets, revert to last state
    if (targets.length === 0)
      this.failTransition(`no attackable targets in range`);

    // Smart first select auto-pick
    const lastDir = (path && path[path.length-1]) || CardinalDirection.North;
    const startingVector = CardinalVector(lastDir);

    // Otherwise, setup the target-picker and move the cursor.
    this.radialPoints = new RadialPointSelector({
      gamepad,
      origin: goal,
      points: targets,
      startingVector,
      onIncrement: this.triggerCursorMove,
      context: this,
    })

    mapCursor.moveTo(this.radialPoints.current);
  }

  update() {
    const { gamepad, instruction } = this.assets;
    const { stagePointerInterface: pointer } = this.assets.scripts;

    const { A, B } = gamepad.button;

    // Handle transition intent
    if (B.pressed || pointer.cancelIntent)
      this.regress();
    else if (A.pressed || pointer.affirmIntent) {
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