import { Scenario } from "../battle/turn-machine/Scenario";
import { Type } from "../CommonTypes";
import { Debug } from "../DebugUtils";
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

  protected configure(): void {
    const { battleSettingsMenu, userPrompt } = this.assets;
    battleSettingsMenu.show();
    userPrompt.text = 'Choose Rules of Engagement:';
  }

  updateInput(): void {
    const { gamepad, battleSettingsMenu, stagePointer } = this.assets;

    const { A, B } = gamepad.button;

    if (A.pressed || battleSettingsMenu.menuPointer.clicked()) {
      this.chosenScenario = battleSettingsMenu.menu.selectedValue;
      this.advance(PickMultiplayer);
    }

    else if (B.pressed || stagePointer.clicked()) {
      this.regress();
    }
  }
}