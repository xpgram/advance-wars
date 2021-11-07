import { Point } from "../../../Common/Point";
import { ListMenuOption } from "../../../system/ListMenuOption";
import { defaultUnitSpawnMap } from "../../UnitSpawnMap";
import { Command } from "../Command";
import { TurnState } from "../TurnState";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";

export class FactoryMenu extends TurnState {
  get name() { return 'FieldMenu'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { players, map, mapCursor, uiMenu, camera } = this.assets;
    const { menu } = uiMenu;

    const location = new Point(mapCursor.pos);
    const square = map.squareAt(location);
    const player = players.current;

    // Assemble list of purchasables
    const spawnMap = defaultUnitSpawnMap.find(spawnMap => spawnMap.type === square.terrain.type)
    const unitTypes = spawnMap?.units || [];

    const listItems = unitTypes.map(type => {
      const unit = new type();
      return new ListMenuOption(unit.name, unit.serial, {
        triggerDisable: () => player.canAfford(unit.cost) === false,
      });
    });

    // Build and position menu
    menu.setListItems(listItems);
    uiMenu.buildGraphics();
    uiMenu.show();
    //@ts-expect-error
    uiMenu.gui.position.set(
      //@ts-expect-error
      camera.center.x - uiMenu.gui.width / 2,
      //@ts-expect-error
      camera.center.y - uiMenu.gui.height / 2,
    );
  }

  update() {
    const { gamepad, uiMenu, instruction } = this.assets;
    const { menu } = uiMenu;

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