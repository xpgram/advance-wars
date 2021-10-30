import { Game } from "../../../..";
import { ListMenuOption } from "../../../system/ListMenuOption";
import { TurnState } from "../TurnState";
import { TurnEnd } from "./TurnEnd";

export class FieldMenu extends TurnState {
    get name() { return 'FieldMenu'; }
    get revertible() { return true; }
    get skipOnUndo() { return false; }

    advanceStates = {
        endTurn: {state: TurnEnd, pre: () => {}}
    }

    assert() { }

    configureScene() {
      this.assets.uiMenu.menu.setListItems([
        new ListMenuOption('Commanders', 1, {
          triggerDisable: () => true,
        }),
        new ListMenuOption('Options', 1, {
          triggerDisable: () => true,
        }),
        new ListMenuOption('End Turn', 9),
        new ListMenuOption('Close', 0),
      ]);
      this.assets.uiMenu.buildGraphics();
      this.assets.uiMenu.show();
      this.assets.uiMenu.gui.position.set(
        this.assets.camera.center.x - this.assets.uiMenu.gui.width / 2,
        this.assets.camera.y + 56,
      );
    }

    update() {
      const { gamepad, uiMenu } = this.assets;
      const { menu } = uiMenu;

      // On press A, handle selected option.
      if (gamepad.button.A.pressed) {
        const value = menu.selectedValue;

        if (value === 9)
          this.advanceToState(this.advanceStates.endTurn);
        else if (value === 0)
          this.regressToPreviousState();
      }

      // On press B, revert to field cursor.
      else if (gamepad.button.B.pressed) {
        this.regressToPreviousState();
      }
    }

    prev() { }
}