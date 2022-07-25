import { PIXI } from "../constants";
import { Game } from "..";
import { VirtualGamepad } from "../scripts/controls/VirtualGamepad";
import { CommandMenuGUI } from "../scripts/system/gui-menu-components/CommandMenuGUI";
import { IconTitle } from "../scripts/system/gui-menu-components/ListMenuTitleTypes";
import { MenuCursor } from "../scripts/system/gui-menu-components/MenuCursor";
import { Scene } from "./Scene";
import { ListMenu } from "../scripts/system/gui-menu-components/ListMenu";
import { MapData } from "../battle-maps/MapData";
import { ListMenuOption } from "../scripts/system/gui-menu-components/ListMenuOption";
import { BattleScene } from "./BattleScene";
import { Point } from "../scripts/Common/Point";
import { TitleScreen } from "./TitleScreen";
import { MapsCollection } from "../battle-maps/maps-collection";
import { StateMaster } from "../scripts/system/state-management/StateMaster";
import { MainMenuAssets } from "../scripts/main-menu/MainMenuAssets";
import { PickMap } from "../scripts/main-menu/PickMap";


/**
 * @author Dei Valko
 */
export class MainMenuScene extends Scene {

  private stateMachine!: StateMaster<MainMenuAssets>;

  private gamepad!: VirtualGamepad;

  private menu!: ListMenu<IconTitle, MapData>;
  private guiMenu!: CommandMenuGUI<MapData>;

  loadStep(): void {
    this.linker.push({name: 'font-map-ui', url: 'assets/font-map-ui.xml'});
    this.linker.push({name: 'font-small-ui', url: 'assets/font-small-ui.xml'});
    this.linker.push({name: 'font-script', url: 'assets/font-script.xml'});
    this.linker.push({name: 'font-menu', url: 'assets/font-menu.xml'});
    this.linker.push({name: 'font-table-header', url: 'assets/font-table-header.xml'});
    this.linker.push({name: 'font-title', url: 'assets/font-title.xml'});
    this.linker.push({name: 'font-label', url: 'assets/font-label.xml'});
    this.linker.push({name: 'font-day-ui', url: 'assets/font-day-ui.xml'});
    this.linker.push({name: 'font-player-splash', url: 'assets/font-player-splash.xml'});
  }

  setupStep(): void {

    this.stateMachine = new StateMaster({
      name: `MainMenuSystem`,
      assets: new MainMenuAssets(this.visualLayers.hud),
      entryPoint: PickMap,
    });

  }

  updateStep(): void {

  }

  destroyStep(): void {
    this.stateMachine.destroy();
  }

}