import { Game } from "../../../..";
import { MainMenuScene } from "../../../../scenes/MainMenu";
import { Point } from "../../../Common/Point";
import { ListMenuOption } from "../../../system/gui-menu-components/ListMenuOption";
import { TurnState } from "../TurnState";
import { TurnEnd } from "./TurnEnd";

export class FieldMenu extends TurnState {
  get type() { return FieldMenu; }
  get name() { return 'FieldMenu'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { fieldMenu, stagePointer } = this.assets;

    // Cancel button-hold while mouse-button-hold is an ingress method to this state.
    stagePointer.button.cancel();

    // TODO Instead of an enum, value could easily be the state to advance to.
    fieldMenu.setListItems([
      new ListMenuOption({title: 'Commanders'}, 1, {
        triggerDisable: () => true,
      }),
      new ListMenuOption({title: 'Options'}, 1, {
        triggerDisable: () => true,
      }),
      new ListMenuOption({title: "Quit"}, 2),
      new ListMenuOption({title: 'End Turn'}, 9),
    ]);
    fieldMenu.menu.resetCursor();
    
    fieldMenu.show();
    fieldMenu.setPosition( new Point(
      0.5*Game.display.renderWidth - 0.5*fieldMenu.graphicalWidth,
      56,
    ));
  }

  update() {
    const { gamepad, fieldMenu, stagePointer } = this.assets;
    const { menu } = fieldMenu;

    // On press A, handle selected option.
    if (gamepad.button.A.pressed || fieldMenu.menuPointer.clicked()) {
      const value = menu.selectedValue;

      if (value === 9)
        this.advance(TurnEnd);
      else if (value === 2)
        Game.transitionToScene(MainMenuScene);
      else if (value === 0)
        this.regress();
    }

    // On press B or press Start, revert to field cursor.
    else if (gamepad.button.B.pressed || gamepad.button.start.pressed || stagePointer.clicked()) {
      this.regress();
    }
  }
  
}