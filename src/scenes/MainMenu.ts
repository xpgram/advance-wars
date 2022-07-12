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
import { maps as blankMaps } from "../battle-maps/blank";
import { maps as campaignMaps } from "../battle-maps/campaign-maps";
import { maps as trialMaps } from "../battle-maps/trial-maps";
import { maps as warroomMaps } from "../battle-maps/war-room-maps";
import { maps as customMaps } from "../battle-maps/awbw-maps";


// TODO I need a design for a proper repository.
import { data as mapMetroIsland } from "../battle-maps/metro-island";
import { data as mapLandsEnd } from "../battle-maps/lands-end";
import { data as mapDev2P } from "../battle-maps/dev-room-2p";


/**
 * @author Dei Valko
 */
export class MainMenuScene extends Scene {

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
    this.gamepad = new VirtualGamepad();  // Is it silly that I have to rebuild this every scene?

    this.menu = new ListMenu(this.gamepad, {
      listItems: [
        ...blankMaps,
        mapMetroIsland,
        mapLandsEnd,
        mapDev2P,
        ...campaignMaps,
        ...trialMaps,
        ...warroomMaps,
        ...customMaps,
      ].map( data => new ListMenuOption({title: data.name}, data)),
      pageLength: 8,
    });

    this.guiMenu = new CommandMenuGUI(this.menu, this.visualLayers.hud);
    this.guiMenu.setPosition(new Point(
      Game.display.renderWidth/2 - this.guiMenu.graphicalWidth/2,
      Game.display.renderHeight/2 - this.guiMenu.graphicalHeight/2
    ));
  }

  updateStep(): void {
    this.gamepad.update();  // TODO Also this. Every scene object? Why?
                            // At the very least, it should be provided by the abstract, like vis-layers.

    if (this.gamepad.button.A.pressed || this.guiMenu.menuPointer.clicked()) {
      const map = this.menu.selectedValue;
      Game.transitionToSceneWithData(BattleScene, map);
    }
    else if (this.gamepad.button.B.pressed) {
      Game.transitionToScene(TitleScreen);
    }
  }

  destroyStep(): void {

  }

}