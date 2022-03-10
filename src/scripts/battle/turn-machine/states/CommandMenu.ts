import { TurnState } from "../TurnState";
import { ChooseAttackTarget } from "./ChooseAttackTarget";
import { Point } from "../../../Common/Point";
import { ListMenuOption } from "../../../system/gui-menu-components/ListMenuOption";
import { MapLayer } from "../../map/MapLayers";
import { Command } from "../Command";
import { DropLocation } from "./DropLocation";
import { Game } from "../../../..";
import { CommandHelpers } from "../Command.helpers";
import { Common } from "../../../CommonUtils";

export class CommandMenu extends TurnState {
  get type() { return CommandMenu; }
  get name(): string { return "CommandMenu"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return false; }

  private autoEnd = false;

  protected configureScene(): void {
    const { map, mapCursor, trackCar, cmdMenu, camera } = this.assets;
    const { actor, place, placeTile, goal, goalTile, goalTerrain, drop } = this.data;
    const { insertIf } = Common;

    // leave trackCar on
    trackCar.show();

    // Clean up map UI — hide highlights from irrelevant tiles.
    map.clearTileOverlay();
    placeTile.moveFlag = true;
    goalTile.moveFlag = true;

    // Reposition mapCursor at relevant tile
    mapCursor.moveTo(goal);

    const destOccupiable = goalTile.occupiable(actor);
    const canMoveOrNotMoved = (actor.canMoveAndAttack || goal.equal(place));

    // Retain attackable flags as well.
    const range = actor.rangeMap;
    const points = range.points.map(p => goal.add(p));
    if (canMoveOrNotMoved && destOccupiable)
      for (const p of points)
        if (map.validPoint(p))
          if (map.squareAt(p).attackable(actor)) {
            map.squareAt(p).attackFlag = true;
          }

    // Get drop command instances and auto-end if all previously selected.
    const dropCommands = actor.loadedUnits
      .map( (u, index) => ({
        ...Command.Drop,
        index,
      }))
      .filter( c => c.triggerInclude() );
    if (dropCommands.length === 0 && drop.length > 0) {
      this.autoEnd = true;
      return;
    }

    // Get commands
    // TODO CommandHelpers.bundles?? .general .wait .drop--(built here)
    const commandsUnsorted = (destOccupiable)
      ? [
        ...insertIf(drop.length === 0, ...Object.values(Command)),
        ...insertIf(drop.length > 0, Command.Wait),
        ...insertIf(actor.unloadPosition(goalTerrain), ...dropCommands),
        ]
      : [Command.Join, Command.Load];
    const commands = commandsUnsorted.sort( (a,b) => a.weight - b.weight );
    
    // Map commands to Menu Options
    const options = commands.map( command => {
      type Drop = typeof Command.Drop;

      const title = command.name;
      const icon = (command.type === Command.Drop && (command as Drop).index >= 0)
        ? actor.loadedUnits[(command as Drop).index].cargoPreview
        : undefined;

      return new ListMenuOption(
        {icon, title},
        command,
        {triggerInclude: () => command.triggerInclude()}
      );
    });

    // Set and build cmdMenu options
    cmdMenu.setListItems(options);
    cmdMenu.menu.resetCursor();

    // Position cmdMenu on screen
    const tileSize = Game.display.standardLength;
    const location = goal.multiply(tileSize).add(new Point(1.25*tileSize, 0));
    const view = camera.transform.worldRect();
    if (view.center.x < location.x)
      location.x = goal.x*tileSize - 0.25*tileSize - cmdMenu.graphicalWidth;
    if (location.y + cmdMenu.graphicalHeight + 4 > view.y + view.height)
      location.y -= location.y + cmdMenu.graphicalHeight + 4 - view.y - view.height;
    cmdMenu.setPosition(location);

    cmdMenu.show();
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

      // TODO This should probably be inferred by some property of CommandObject (Drop)
      if (commandValue === Command.Drop.serial) {
        const drop = menu.selectedValue as typeof Command.Drop;
        instruction.which = drop.index;
      }

      const cmd = CommandHelpers.getCommandObject(commandValue);
      this.advance(...cmd.ingressSteps);
    }

    // If B, cancel, revert state
    else if (gamepad.button.B.pressed) {
      this.regress();
    }
  }

}