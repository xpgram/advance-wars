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
    // TODO Every other component manages to be self-dependent via tickers and such, why does gamepad need its own, special little update() clause?
    // VirtualGamepad was written really early on. I think it's time it was updated a bit. I don't know which ticker it should assign itself to,
    // I guess just scene's, but in any case, all components here should be assumed to be self-reliant; a lot of redundant code otherwise.
    // I think I'll keep update() here for non-components? Like, regular-ass variables and such. I can't imagine wtf I would use it for, though.

    // TODO update() and suspendInteractivity() should have default implementations; StateAssets should be an abstract class, then.

    // TODO Another reading: since MainMenuAssets is unique to the MainMenuScene anyway, why is this a class object?
    // MainMenuAssets could describe a *type* and that then is what is used to communicate between the State objects, but MainMenuScene
    // is what would actually assemble all these things together; that's kind of what it's for.
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