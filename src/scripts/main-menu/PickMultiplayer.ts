import { Game } from "../..";
import { BattleScene } from "../../scenes/BattleScene";
import { Scenario } from "../battle/turn-machine/Scenario";
import { Point } from "../Common/Point";
import { Debug } from "../DebugUtils";
import { CommandMenuGUI } from "../system/gui-menu-components/CommandMenuGUI";
import { ListMenu } from "../system/gui-menu-components/ListMenu";
import { ListMenuOption } from "../system/gui-menu-components/ListMenuOption";
import { StateObject } from "../system/state-management/StateObject";
import { MainMenuAssets } from "./MainMenuAssets";
import { PickMap } from "./PickMap";
import { PickPreset } from "./PickPreset";



export class PickMultiplayer extends StateObject<MainMenuAssets> {
  get type() { return PickMultiplayer; }
  get name() { return `PickMultiplayer`; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  private guiMenu!: CommandMenuGUI<Pick<Scenario, 'remoteMultiplayerMatch'>>;


  protected configure(): void {
    const { gamepad, userPrompt } = this.assets;
    
    // Reveal or build gui menu
    if (this.guiMenu) {
      this.guiMenu.show();
    } else {
      const presets: Array<[string, Pick<Scenario, 'remoteMultiplayerMatch'>]> = [
        ['Local', { remoteMultiplayerMatch: false }],
        ['Online', { remoteMultiplayerMatch: true }],
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
        Point.Normals.Center,
      );
    }

    userPrompt.text = 'Choose Multiplayer Mode:';
  }

  updateInput() {
    const { gamepad, stagePointer } = this.assets;
    const { menuPointer, menu } = this.guiMenu;

    const { A, B } = gamepad.button;

    if (A.pressed || menuPointer.clicked()) {
      const mapdata = this.machine.getState(PickMap)?.chosenMap;
      const gameRulesScenario = this.machine.getState(PickPreset)?.chosenScenario;
      const multiplayerScenario = menu.selectedValue;

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

  protected onClose(): void {
    this.guiMenu.hide();
  }

  protected onDestroy(): void {
    this.guiMenu.destroy();
  }
}