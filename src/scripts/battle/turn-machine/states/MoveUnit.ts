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

  updateUiSystems() {
    const { map, mapCursor, players, uiSystem } = this.assets;
    const { actor, place, seed } = this.data;

    // Change cursor mode
    const tile = map.squareAt(mapCursor.pos);
    const unit = tile.unit;
    const boardable = unit?.boardable(actor);
    const mergeable = unit?.mergeable(actor);
    const sameFaction = unit?.faction === players.current.faction;
    const reachable = tile.moveFlag;

    const actionable = reachable && sameFaction && (boardable || mergeable);
    const attackable = tile.attackFlag;

    mapCursor.mode = (actionable || attackable) ? 'target' : 'point';

    // Update damage forecast
    if (unit && attackable && !sameFaction) {
      const goal = SumCardinalsToVector(map.pathFrom(place)).add(actor.boardLocation);
      const damage = DamageScript.NormalAttack(map, actor, goal, unit, seed);
      uiSystem.battleForecast = damage.estimate;
    } else {
      uiSystem.battleForecast = undefined;
    }
  }

  configureScene() {
    const { map, mapCursor, uiSystem, trackCar, scripts } = this.assets;
    const { actor, placeTile } = this.data;

    mapCursor.show();
    uiSystem.show();

    // Hide unit's map sprite
    placeTile.hideUnit = true;

    // Show the unit's trackcar
    trackCar.buildNewAnimation(actor);
    trackCar.show();

    // Generate movement map
    map.generateMovementMap(actor);

    // Enable control shortcuts
    scripts.nextTargetableUnit.enable();    // Depends on map.generateMovementMap()
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

    // Request a recalc of the travel path on cursor move.
    // *None of this* can be a listener callback on mapCursor because I don't want
    // any discrepancy between recalc and A button presses.
    if (this.lastCursorPos.notEqual(mapCursor.pos)) {
      this.lastCursorPos = mapCursor.pos;

      // Determine whether smart, range-map pathfinding is necessary.
      const selectingOverTarget = (map.squareAt(mapCursor.pos).attackFlag);
      const rangeMap = (selectingOverTarget)
        ? actor.rangeMap
        : undefined;

      map.recalculatePathToPoint(actor, mapCursor.pos, rangeMap);
      this.updateUiSystems();
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