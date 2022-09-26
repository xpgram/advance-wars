import { Game } from "../..";
import { BattleScene } from "../../scenes/BattleScene";
import { Debug } from "../DebugUtils";
import { StateObject } from "../system/state-management/StateObject";
import { MainMenuAssets } from "./MainMenuAssets";
import { PickMap } from "./PickMap";
import { PickPreset } from "./PickPreset";



export class PickMultiplayer extends StateObject<MainMenuAssets> {
  get type() { return PickMultiplayer; }
  get name() { return `PickMultiplayer`; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }


  protected configure(): void {
    const { remoteMultiplayerMenu, userPrompt } = this.assets;
    remoteMultiplayerMenu.show();
    userPrompt.text = 'Choose Multiplayer Mode:';
  }

  updateInput() {
    const { gamepad, remoteMultiplayerMenu, stagePointer } = this.assets;

    const { A, B } = gamepad.button;

    if (A.pressed || remoteMultiplayerMenu.menuPointer.clicked()) {
      const mapdata = this.machine.getState(PickMap)?.chosenMap;
      const gameRulesScenario = this.machine.getState(PickPreset)?.chosenScenario;
      const multiplayerScenario = remoteMultiplayerMenu.menu.selectedValue;

      // Report missing data
      if (!mapdata || !gameRulesScenario) {
        const missingdata = (!mapdata && !gameRulesScenario)
          ? 'map and scenario'
          : (!mapdata)
          ? 'map'
          : 'scenario'

        Debug.log("MainMenu", "ContinueToBattleScene", {
          message: `rejecting intent to transition to battle scene`,
          reason: `${missingdata} data is missing from the previous-state capture`,
          warn: true,
        })

        return;
      }

      // Transition to war-game state
      const scenario = {
        ...gameRulesScenario,
        ...multiplayerScenario,
      }
      Game.transitionToSceneWithData(BattleScene, {mapdata, scenario});
    }

    else if (B.pressed || stagePointer.clicked()) {
      this.regress();
    }
  }
}