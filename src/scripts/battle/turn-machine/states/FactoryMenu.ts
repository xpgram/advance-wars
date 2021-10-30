import { Point } from "../../../Common/Point";
import { ListMenuOption } from "../../../system/ListMenuOption";
import { Unit } from "../../Unit";
import { UnitType } from "../../UnitObject";
import { defaultUnitSpawnMap } from "../../UnitSpawnMap";
import { TurnState } from "../TurnState";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";

export class FactoryMenu extends TurnState {
    get name() { return 'FieldMenu'; }
    get revertible() { return true; }
    get skipOnUndo() { return false; }

    advanceStates = {
        ratifyOrder: {state: RatifyIssuedOrder, pre: () => {}}
    }

    assert() { }

    configureScene() {
      const { players, map, mapCursor, uiMenu, camera } = this.assets;
      const { menu } = uiMenu;

      const location = new Point(mapCursor.pos);
      const square = map.squareAt(location);
      const player = players.current;

      // Assemble list of purchasables
      const spawnMap = defaultUnitSpawnMap.find( spawnMap => spawnMap.type === square.terrain.type )
      const unitTypes = spawnMap?.units || [];
    
      const listItems = unitTypes.map( type => {
        const unit = new type();
        return new ListMenuOption(unit.name, unit.serial, {
          triggerDisable: () => player.canAfford(unit.cost) === false,
        });
      });
      
      // Build and position menu
      menu.setListItems(listItems);
      uiMenu.buildGraphics();
      uiMenu.show();
      uiMenu.gui.position.set(
        camera.center.x - uiMenu.gui.width / 2,
        camera.center.y - uiMenu.gui.height / 2,
      );
    }

    update() {
      const { gamepad, uiMenu } = this.assets;
      const { menu } = uiMenu;

      // On press A, handle selected option.
      if (gamepad.button.A.pressed) {
        const option = menu.selectedOption;
        const serial = option.value;

        if (!option.disabled) {
          // TODO I need to send something to ratify, probably do this there
          const location = new Point(this.assets.mapCursor.pos);
          const unit = this.assets.players.current.spawnUnit({
            location,
            serial,
            spent: true,
          });
          this.assets.players.current.expendFunds(unit.cost);

          // TODO This is obviously mega broken. Commands *must* be ratified.
          // this.advanceToState(this.advanceStates.ratifyOrder);
          this.regressToPreviousState();
        }
      }

      // On press B, revert to field cursor.
      else if (gamepad.button.B.pressed) {
        this.regressToPreviousState();
      }
    }

    prev() { }
}