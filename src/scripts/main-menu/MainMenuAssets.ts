import { Game } from "../..";
import { MapData } from "../../battle-maps/MapData";
import { MapsCollection } from "../../battle-maps/maps-collection";
import { PIXI } from "../../constants";
import { ScenarioOptions } from "../battle/turn-machine/BattleSceneControllers";
import { Point } from "../Common/Point";
import { Common } from "../CommonUtils";
import { VirtualGamepad } from "../controls/VirtualGamepad";
import { CommandMenuGUI } from "../system/gui-menu-components/CommandMenuGUI";
import { ListMenu } from "../system/gui-menu-components/ListMenu";
import { ListMenuOption } from "../system/gui-menu-components/ListMenuOption";
import { StateAssets } from "../system/state-management/StateAssets";


export class MainMenuAssets implements StateAssets {

  gamepad: VirtualGamepad;

  mapMenu: CommandMenuGUI<MapData>;
  battleSettingsMenu: CommandMenuGUI<ScenarioOptions>;

  constructor(hudVisualLayer: PIXI.Container) {
    this.gamepad = new VirtualGamepad();
    
    // Build menu for map pick
    this.mapMenu = new CommandMenuGUI(
      new ListMenu(this.gamepad, {
        listItems: MapsCollection.fromCriteria()
          .map( data => new ListMenuOption({title: data.name}, data)),
        pageLength: 8,
      }),
      hudVisualLayer
    );
    this.mapMenu.setPosition(new Point(
      Game.display.renderWidth/2 - this.mapMenu.graphicalWidth/2,
      Game.display.renderHeight/2 - this.mapMenu.graphicalHeight/2,
    ));


    // Quick battle presets
    const battlePresets: ([string, ScenarioOptions])[] = [
      ['Normal Battle', {
        // None
      }],
      ['Fog of War Battle', {
        fogOfWar: true,
      }],
    ];

    // Build menu for quick battle settings
    this.battleSettingsMenu = new CommandMenuGUI(
      new ListMenu(this.gamepad, {
        listItems: battlePresets.map( ([title, data]) => new ListMenuOption({title}, data)),
        pageLength: 8,
      }),
      hudVisualLayer
    );
    this.battleSettingsMenu.setPosition(new Point(
      Game.display.renderWidth/2 - this.battleSettingsMenu.graphicalWidth/2,
      Game.display.renderHeight/2 - this.battleSettingsMenu.graphicalHeight/2,
    ))
  }

  update() {
    this.gamepad.update();
  }

  suspendInteractivity(): boolean {
    return false;
  }

  resetAssets(): void {
    this.mapMenu.hide();
    this.battleSettingsMenu.hide();
  }

  destroy(): void {
    this.mapMenu.destroy();
    this.battleSettingsMenu.destroy();
  }
}