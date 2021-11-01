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
      // TODO Instead of an enum, value could easily be the state to advance to.
      this.assets.uiMenu.menu.setListItems([
        new ListMenuOption('Commanders', 1, {
          triggerDisable: () => true,
        }),
        new ListMenuOption('Options', 1, {
          triggerDisable: () => true,
        }),
        new ListMenuOption('End Turn', 9),
      ]);

      // TODO This should be a different ui menu held in the global UI layer, not map ui.
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

      // On press B or press Start, revert to field cursor.
      else if (gamepad.button.B.pressed || gamepad.button.start.pressed) {
        this.regressToPreviousState();
      }
    }

    prev() { }
}