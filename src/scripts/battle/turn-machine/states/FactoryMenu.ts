import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { ListMenuOption } from "../../../system/gui-menu-components/ListMenuOption";
import { defaultUnitSpawnMap } from "../../UnitSpawnMap";
import { Command } from "../Command";
import { TurnState } from "../TurnState";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";

export class FactoryMenu extends TurnState {
  get name() { return 'FieldMenu'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { players, map, mapCursor, shopMenu, camera } = this.assets;
    const { menu } = shopMenu;

    const location = new Point(mapCursor.pos);
    const square = map.squareAt(location);
    const player = players.current;

    // Assemble list of purchasables
    const spawnMap = defaultUnitSpawnMap.find(spawnMap => spawnMap.type === square.terrain.type)
    const unitTypes = spawnMap?.units || [];

    const listItems = unitTypes.map(type => {
      const unit = new type();
      const key = {
        icon: new PIXI.Sprite(),
        title: unit.name,
        cost: unit.cost,
      }
      return new ListMenuOption(key, unit.serial, {
        triggerDisable: () => player.canAfford(unit.cost) === false,
      });
    });

    // Build and position menu
    shopMenu.setListItems(listItems);
    menu.resetCursor();   // Only because there is no separation between the different base types.
    shopMenu.show();
    shopMenu.gui.position.set(
      16,
      40,
    );
  }

  update() {
    const { gamepad, shopMenu, instruction } = this.assets;
    const { menu } = shopMenu;

    // On press A, handle selected option.
    if (gamepad.button.A.pressed) {
      const option = menu.selectedOption;
      const unitSerial = option.value;

      if (!option.disabled) {
        instruction.place = new Point(this.assets.mapCursor.pos);
        instruction.action = Command.SpawnUnit.serial;
        instruction.which = unitSerial;

        this.advanceToState(RatifyIssuedOrder);
      }
    }

    // On press B, revert to field cursor.
    else if (gamepad.button.B.pressed) {
      this.regressToPreviousState();
    }
  }

}