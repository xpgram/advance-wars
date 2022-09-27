import { Game } from "../..";
import { MapData } from "../../battle-maps/MapData";
import { MapsCollection } from "../../battle-maps/maps-collection";
import { TitleScreen } from "../../scenes/TitleScreen";
import { Point } from "../Common/Point";
import { Type } from "../CommonTypes";
import { CommandMenuGUI } from "../system/gui-menu-components/CommandMenuGUI";
import { ListMenu } from "../system/gui-menu-components/ListMenu";
import { ListMenuOption } from "../system/gui-menu-components/ListMenuOption";
import { StateObject } from "../system/state-management/StateObject";
import { MainMenuAssets } from "./MainMenuAssets";
import { PickPreset } from "./PickPreset";


export class PickMap extends StateObject<MainMenuAssets> {
  get type(): Type<StateObject<MainMenuAssets>> { return PickMap; }
  get name(): string { return `PickMap`; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  chosenMap?: MapData;

  private guiMenu!: CommandMenuGUI<MapData>;

  protected configure(): void {
    const { gamepad, userPrompt } = this.assets;
    
    // Reveal or build the guiMenu for map selection
    if (this.guiMenu) {
      this.guiMenu.show();
    } else {
      this.guiMenu = new CommandMenuGUI(
        new ListMenu(gamepad, {
          listItems: MapsCollection.fromCriteria()
            .map( data => new ListMenuOption({title: data.name}, data)),
          pageLength: 8,
        }),
        Game.scene.visualLayers.hud,
      );

      this.guiMenu.setPosition(
        Game.display.renderDimensions.multiply(.5),
        Point.Normals.Center,
      );
    }

    userPrompt.text = 'Choose Map:';
  }

  updateInput() {
    const { gamepad } = this.assets;
    const { menuPointer, menu } = this.guiMenu;

    const { A, B } = gamepad.button;

    if (A.pressed || menuPointer.clicked()) {
      this.chosenMap = menu.selectedValue;
      this.advance(PickPreset);
    }

    else if (B.pressed) {
      Game.transitionToScene(TitleScreen);
    }
  }
  
  protected onClose(): void {
    this.guiMenu.hide();
  }

  protected onDestroy(): void {
    this.guiMenu.destroy();
  }
}