import { Game } from "../..";
import { Scenario } from "../battle/turn-machine/Scenario";
import { Point } from "../Common/Point";
import { Type } from "../CommonTypes";
import { Debug } from "../DebugUtils";
import { CommandMenuGUI } from "../system/gui-menu-components/CommandMenuGUI";
import { ListMenu } from "../system/gui-menu-components/ListMenu";
import { ListMenuOption } from "../system/gui-menu-components/ListMenuOption";
import { StateObject } from "../system/state-management/StateObject";
import { MainMenuAssets } from "./MainMenuAssets";
import { PickMap } from "./PickMap";
import { PickMultiplayer } from "./PickMultiplayer";


export class PickPreset extends StateObject<MainMenuAssets> {
  get type(): Type<StateObject<MainMenuAssets>> { return PickPreset; }
  get name(): string { return `PickPreset`; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return false; }

  chosenScenario?: Partial<Scenario>;

  private guiMenu!: CommandMenuGUI<Partial<Scenario>>;

  protected configure(): void {
    const { gamepad, userPrompt } = this.assets;

    // Reveal or build menu
    if (this.guiMenu) {
      this.guiMenu.show();
    } else {
      const presets: Array<[string, Partial<Scenario>]> = [
        ['Normal Battle', { }],
        ['Fog of War Battle', { fogOfWar: true }],
      ];

      this.guiMenu = new CommandMenuGUI(
        new ListMenu(gamepad, {
          listItems: presets.map( ([title, data]) => new ListMenuOption({title}, data)),
          pageLength: 8,
        }),
        Game.scene.visualLayers.hud,
      );

      this.guiMenu.setPosition(
        Game.display.renderDimensions.multiply(.5),
        Point.Normals.Center
      );
    }
    
    userPrompt.text = 'Choose Rules of Engagement:';
  }

  updateInput(): void {
    const { gamepad, stagePointer } = this.assets;
    const { menuPointer, menu } = this.guiMenu;

    const { A, B } = gamepad.button;

    if (A.pressed || menuPointer.clicked()) {
      this.chosenScenario = menu.selectedValue;
      this.advance(PickMultiplayer);
    }

    else if (B.pressed || stagePointer.clicked()) {
      this.regress();
    }
  }

  protected onClose(): void {
    this.guiMenu.hide();
  }

  protected onDestroy(): void {
    this.guiMenu.destroy();
  }
}