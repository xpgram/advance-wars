import { TurnState } from "../TurnState";
import { Point } from "../../../Common/Point";
import { Command } from "../Command";
import { SumCardinalsToVector } from "../../../Common/CardinalDirection";
import { CommandMenu } from "./CommandMenu";
import { DamageScript } from "../../DamageScript";

export class MoveUnit extends TurnState {
  get type() { return MoveUnit; }
  get name() { return 'MoveUnit'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  private lastCursorPos = new Point(-1, -1);

  changeCursorMode() {
    const { map, mapCursor, players } = this.assets;
    const { actor } = this.data;

    const unit = map.squareAt(mapCursor.pos).unit;
    const boardable = unit?.boardable(actor);
    const mergeable = unit?.mergeable(actor);
    const sameFaction = unit?.faction === players.current.faction;

    mapCursor.mode = ((boardable || mergeable) && sameFaction) ? 'target' : 'point';
  }

  // TODO This script is also written in ChooseAttackTarget; combine them.
  updateDamageForecast(from: Point) {
    const { map, mapCursor, uiSystem, players } = this.assets;
    const { actor, seed } = this.data;
    const goal = from;

    const focalTile = map.squareAt(mapCursor.pos);
    const focalUnit = focalTile.unit;
    if (focalUnit && focalUnit.faction !== players.current.faction) {
      const damage = DamageScript.NormalAttack(map, actor, goal, focalUnit, seed);
      uiSystem.battleForecast = damage.estimate;
    } else {
      uiSystem.battleForecast = undefined;
    }
  }

  configureScene() {
    const { map, mapCursor, uiSystem, trackCar } = this.assets;
    const { actor, placeTile } = this.data;

    mapCursor.show();
    uiSystem.show();

    // Hide unit's map sprite
    placeTile.hideUnit = true;

    // Show the unit's trackcar
    trackCar.buildNewAnimation(actor);
    trackCar.show();

    // Configure map cursor to update pointer graphic over certain terrains
    mapCursor.on('move', this.changeCursorMode, this);
    mapCursor.teleport(mapCursor.pos);  // Trigger cursor mode.

    // Generate movement map
    map.generateMovementMap(actor);
  }

  close() {
    const { mapCursor } = this.assets;
    mapCursor.removeListener(this.changeCursorMode, this);
  }

  update() {
    const { map, mapCursor, gamepad, players, instruction } = this.assets;
    const { actor, place } = this.data;

    // On press B, revert state
    if (gamepad.button.B.pressed)
      this.regress();

    // If the unit is not owned by current player, do nothing else
    if (players.current.faction !== actor.faction)
      return;

    // Request a recalc of the travel path on cursor move
    if (this.lastCursorPos.notEqual(mapCursor.pos)) {
      this.lastCursorPos = mapCursor.pos;

      // Determine whether smart, range-map pathfinding is necessary.
      const selectingOverTarget = (map.squareAt(mapCursor.pos).attackFlag);
      const rangeMap = (selectingOverTarget)
        ? actor.rangeMap
        : undefined;

      map.recalculatePathToPoint(actor, mapCursor.pos, rangeMap);

      // Update UI systems
      mapCursor.mode = (selectingOverTarget) ? 'target' : 'point';
      
      const terminal = SumCardinalsToVector(map.pathFrom(place)).add(actor.boardLocation);
      this.updateDamageForecast(terminal);
    }

    // On press A and viable location, advance state
    else if (gamepad.button.A.pressed) {
      const square = map.squareAt(mapCursor.pos);
      const underneath = square.unit;

      // TODO Some of this is the same as Join.trigger() and other commands.
      // Wouldn't it be nice if I could just ask "Will there be any commands here?"

      const moveable = square.moveFlag;
      // const commandable = [Command.Load, Command.Join].every( c => c.triggerInclude() );
      const occupiable = square.occupiable(actor);
      const mergeable = underneath?.mergeable(actor);
      const boardable = underneath?.boardable(actor);
      const attackable = square.attackFlag;

      // Final check
      if (moveable && (occupiable || mergeable || boardable)) {
        instruction.path = map.pathFrom(place);
        this.advance(CommandMenu);
      }
      else if (attackable) {
        // TODO Doesn't (or shouldn't) this transition to a confirm state first?
        instruction.path = map.pathFrom(place);
        instruction.action = Command.Attack.serial;
        instruction.focal = mapCursor.pos;
        this.advance();
      }
    }
  }

  prev() {
    const { map, mapCursor, trackCar } = this.assets;
    const { place, placeTile } = this.data;

    placeTile.hideUnit = false;
    trackCar.hide();
    map.clearMovementMap();
    mapCursor.moveTo(place);
  }

}