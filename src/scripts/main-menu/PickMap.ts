import { Game } from "../..";
import { MapData } from "../../battle-maps/MapData";
import { TitleScreen } from "../../scenes/TitleScreen";
import { Type } from "../CommonTypes";
import { StateObject } from "../system/state-management/StateObject";
import { MainMenuAssets } from "./MainMenuAssets";
import { PickPreset } from "./PickPreset";


export class PickMap extends StateObject<MainMenuAssets> {
  get type(): Type<StateObject<MainMenuAssets>> { return PickMap; }
  get name(): string { return `PickMap`; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  chosenMap?: MapData;

  protected configure(): void {
    const { mapMenu, userPrompt } = this.assets;
    mapMenu.show();
    userPrompt.text = 'Choose Map:';
  }

  updateInput() {
    const { gamepad, mapMenu } = this.assets;

    const { A, B } = gamepad.button;

    if (A.pressed || mapMenu.menuPointer.clicked()) {
      this.chosenMap = mapMenu.menu.selectedValue;
      this.advance(PickPreset);
    }

    else if (B.pressed) {
      Game.transitionToScene(TitleScreen);
    }
  }
}