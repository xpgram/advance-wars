import { Game } from "../..";
import { MapData } from "../../battle-maps/MapData";
import { BattleScene } from "../../scenes/BattleScene";
import { Type } from "../CommonTypes";
import { StateObject } from "../system/state-management/StateObject";
import { MainMenuAssets } from "./MainMenuAssets";
import { PickMap } from "./PickMap";


export class PickPreset extends StateObject<MainMenuAssets> {
  get type(): Type<StateObject<MainMenuAssets>> { return PickPreset; }
  get name(): string { return `PickPreset`; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return false; }

  protected configure(): void {
    const { battleSettingsMenu, userPrompt } = this.assets;
    battleSettingsMenu.show();
    userPrompt.text = 'Choose Rules of Engagement:';
  }

  updateInput(): void {
    const { gamepad, battleSettingsMenu, stagePointer } = this.assets;

    const { A, B } = gamepad.button;

    if (A.pressed || battleSettingsMenu.menuPointer.clicked()) {
      const mapdata = this.machine.getState(PickMap)?.chosenMap;
      const scenario = battleSettingsMenu.menu.selectedValue;

      if (!mapdata) {  // TODO This process needs to be streamlined
        this.machine.failToPreviousState(this);
        return;
      }
      
      Game.transitionToSceneWithData(BattleScene, {mapdata, scenario});
    }

    else if (B.pressed || stagePointer.clicked()) {
      this.regress();
    }
  }
}