import { Game } from "../../../..";
import { ListMenuOption } from "../../../system/gui-menu-components/ListMenuOption";
import { TurnState } from "../TurnState";
import { TurnEnd } from "./TurnEnd";

export class FieldMenu extends TurnState {
  get type() { return FieldMenu; }
  get name() { return 'FieldMenu'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { fieldMenu, camera } = this.assets;

    // TODO Instead of an enum, value could easily be the state to advance to.
    fieldMenu.setListItems([
      new ListMenuOption({title: 'Commanders'}, 1, {
        triggerDisable: () => true,
      }),
      new ListMenuOption({title: 'Options'}, 1, {
        triggerDisable: () => true,
      }),
      new ListMenuOption({title: 'End Turn'}, 9),
    ]);
    fieldMenu.menu.resetCursor();
    
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
        this.advance(TurnEnd);
      else if (value === 0)
        this.regress();
    }

    // On press B or press Start, revert to field cursor.
    else if (gamepad.button.B.pressed || gamepad.button.start.pressed) {
      this.regress();
    }
  }
  
}