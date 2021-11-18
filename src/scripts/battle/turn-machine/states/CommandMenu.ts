import { TurnState } from "../TurnState";
import { AnimateMoveUnit } from "./AnimateMoveUnit";
import { ChooseAttackTarget } from "./ChooseAttackTarget";
import { Point } from "../../../Common/Point";
import { ListMenuOption } from "../../../system/gui-menu-components/ListMenuOption";
import { MapLayer } from "../../map/MapLayers";
import { Command, CommandObject } from "../Command";
import { DropLocation } from "./DropLocation";
import { Game } from "../../../..";

export class CommandMenu extends TurnState {
  get name(): string { return "CommandMenu"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return false; }

  private autoEnd = false;

  protected configureScene(): void {
    const { map, mapCursor, trackCar, cmdMenu, camera } = this.assets;
    const { actor, place, placeTile, goal, goalTile, goalTerrain, drop } = this.data;

    // leave trackCar on
    trackCar.show();

    // Clean up map UI — hide highlights from irrelevant tiles.
    map.clearTileOverlay();
    placeTile.moveFlag = true;
    goalTile.moveFlag = true;

    // Reposition mapCursor at relevant tile
    mapCursor.moveTo(goal);

    const destOccupiable = goalTile.occupiable(actor);
    const notIndirectOrNotMoved = (!actor.isIndirect || goal.equal(place));

    // Retain attackable flags as well.
    const range = actor.rangeMap;
    const points = range.points.map(p => goal.add(p));
    if (notIndirectOrNotMoved && destOccupiable)
      for (const p of points)
        if (map.validPoint(p))
          if (map.squareAt(p).attackable(actor)) {
            map.squareAt(p).attackFlag = true;
          }

    // Get drop command instances and auto-end if all previously selected.
    const dropCommands = actor.loadedUnits
      .map( (u, idx) => ({
        ...Command.Drop,
        input: idx,
      }))
      .filter( c => c.triggerInclude() );
    if (dropCommands.length === 0 && drop.length > 0) {
      this.autoEnd = true;
      return;
    }

    // Get commands
    const commands = (destOccupiable)
      ? Object.values(Command)
        .concat( (actor.unloadPosition(goalTerrain)) ? dropCommands : [] )
        .sort( (a,b) => a.weight - b.weight )
      : [Command.Join, Command.Load];
    const options = commands.map( command =>
      new ListMenuOption(
        {
          // This is bad, but it's fine-bad.
          icon: (command.name === 'Drop' && command.input >= 0)
            ? actor.loadedUnits[command.input].preview
            : undefined,
          title: command.name
        },
        command, {
          triggerInclude: () => command.triggerInclude(),
        }
      )
    );

    // Set and build cmdMenu options
    cmdMenu.setListItems(options);
    cmdMenu.menu.resetCursor();

    // Position cmdMenu on screen
    const tileSize = Game.display.standardLength;
    const location = goal.multiply(tileSize).add(new Point(1.25*tileSize, 0));
    if (camera.center.x < location.x)
      location.x = goal.x*tileSize - 0.25*tileSize - cmdMenu.menuGui.width;
    if (location.y + cmdMenu.gui.height + 4 > camera.y + camera.height)
      location.y -= location.y + cmdMenu.gui.height + 4 - camera.y - camera.height;
    cmdMenu.gui.position.set(location.x, location.y);
    cmdMenu.gui.zIndex = 1000;

    // Sort ui layer
    MapLayer('ui').sortChildren();
    cmdMenu.show();

    // TODO .sortChildren() should not be here.

    // TODO unit.commands should be how the selectables are determined.
    // Maybe commands returns a name/script pair? value = script.
    // Then, the units themselves can codify how many options they have,
    // when they present themselves, and what they do after selection.
    //
    // Units have a reference to map, don't they? They might not.
    // I guess they will.
    //
    // Problem: 'Supply' also triggers animations. Under the system just
    // described, how would it? I could queue animations and play them
    // during a generic animation state, but that's some work, yo.
    // Not sure I wanna do that right now.
  }

  update(): void {
    const { gamepad, instruction } = this.assets;
    const { menu } = this.assets.cmdMenu;

    // If A, infer next action from cmdMenu.
    if (gamepad.button.A.pressed || this.autoEnd) {
      const commandValue = (!this.autoEnd)
        ? menu.selectedValue.serial
        : Command.Wait.serial;
      instruction.action = commandValue;

      if (commandValue == Command.Attack.serial)
        this.advanceToState(ChooseAttackTarget);
      else if (commandValue === Command.Drop.serial) {
        instruction.which = menu.selectedValue.input;
        this.advanceToState(DropLocation);
      } else {
        this.advanceToState(AnimateMoveUnit);
      }
    }

    // If B, cancel, revert state
    else if (gamepad.button.B.pressed) {
      this.regressToPreviousState();
    }
  }

}