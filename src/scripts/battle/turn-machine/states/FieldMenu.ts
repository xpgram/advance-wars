import { Game } from "../../../..";
import { MainMenuScene } from "../../../../scenes/MainMenu";
import { Point } from "../../../Common/Point";
import { ListMenuOption } from "../../../system/gui-menu-components/ListMenuOption";
import { TurnState } from "../TurnState";
import { TurnEnd } from "./TurnEnd";


enum Menu {
  Close = 0,
  Blank,
  Quit,
  EndTurn,
}


export class FieldMenu extends TurnState {
  get type() { return FieldMenu; }
  get name() { return 'FieldMenu'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { fieldMenu, stagePointer, players, multiplayer } = this.assets;

    // Cancel button-hold while mouse-button-hold is an ingress method to this state.
    stagePointer.button.cancel();

    // TODO Instead of an enum, value could easily be the state to advance to.
    fieldMenu.setListItems([
      new ListMenuOption({title: 'Commanders'}, Menu.Blank, {
        triggerDisable: () => true,
      }),
      new ListMenuOption({title: 'Options'}, Menu.Blank, {
        triggerDisable: () => true,
      }),
      new ListMenuOption({title: "Quit"}, Menu.Quit),
      new ListMenuOption({title: 'End Turn'}, Menu.EndTurn),
    ]);
    fieldMenu.menu.resetCursor();
    
    fieldMenu.show();
    fieldMenu.setPosition( new Point(
      0.5*Game.display.renderWidth - 0.5*fieldMenu.graphicalWidth,
      56,
    ));
  }

  update() {
    const { gamepad, fieldMenu, stagePointer, map, multiplayer } = this.assets;
    const { menu } = fieldMenu;

    // On press A, handle selected option.
    if (gamepad.button.A.pressed || fieldMenu.menuPointer.clicked()) {
      const switchable: Record<Menu, () => void> = {
        [Menu.Close]: () => this.regress(),
        [Menu.Blank]: () => this.regress(),
        [Menu.EndTurn]: () => this.advance(TurnEnd),
        [Menu.Quit]: () => Game.transitionToScene(MainMenuScene),
      }

      // TODO 'as Menu' is a bandaid for 'FieldMenu<number>' in assets; I just don't feel like extracting.
      const value = menu.selectedValue as Menu;
      switchable[value]();
    }

    // On press B or press Start, revert to field cursor.
    else if (gamepad.button.B.pressed || gamepad.button.start.pressed || stagePointer.clicked()) {
      this.regress();
    }
  }
  
}