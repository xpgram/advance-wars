import { Game } from "../../../..";
import { ListMenuOption } from "../../../system/ListMenuOption";
import { TurnState } from "../TurnState";
import { TurnEnd } from "./TurnEnd";

export class FieldMenu extends TurnState {
  get name() { return 'FieldMenu'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { fieldMenu, camera } = this.assets;

    // TODO Instead of an enum, value could easily be the state to advance to.
    fieldMenu.menu.setListItems([
      new ListMenuOption('Commanders', 1, {
        triggerDisable: () => true,
      }),
      new ListMenuOption('Options', 1, {
        triggerDisable: () => true,
      }),
      new ListMenuOption('End Turn', 9),
    ]);

    // TODO This should be a different ui menu held in the global UI layer, not map ui.
    fieldMenu.buildGraphics();
    fieldMenu.show();
    //@ts-expect-error
    fieldMenu.gui.position.set(
      0.5*Game.display.renderWidth - 0.5*fieldMenu.gui.width,
      56,
    );
  }

  update() {
    const { gamepad, fieldMenu } = this.assets;
    const { menu } = fieldMenu;

    // On press A, handle selected option.
    if (gamepad.button.A.pressed) {
      const value = menu.selectedValue;

      if (value === 9)
        this.advanceToState(TurnEnd);
      else if (value === 0)
        this.regressToPreviousState();
    }

    // On press B or press Start, revert to field cursor.
    else if (gamepad.button.B.pressed || gamepad.button.start.pressed) {
      this.regressToPreviousState();
    }
  }
  
}