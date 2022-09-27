import { Game } from "../..";
import { MapData } from "../../battle-maps/MapData";
import { MapsCollection } from "../../battle-maps/maps-collection";
import { PIXI } from "../../constants";
import { Scenario } from "../battle/turn-machine/Scenario";
import { fonts } from "../battle/ui-windows/DisplayInfo";
import { BoxContainerProperties } from "../Common/BoxContainerProperties";
import { Point } from "../Common/Point";
import { ClickableContainer } from "../controls/MouseInputWrapper";
import { VirtualGamepad } from "../controls/VirtualGamepad";
import { CommandMenuGUI } from "../system/gui-menu-components/CommandMenuGUI";
import { ListMenu } from "../system/gui-menu-components/ListMenu";
import { ListMenuOption } from "../system/gui-menu-components/ListMenuOption";
import { StateAssets } from "../system/state-management/StateAssets";


export class MainMenuAssets implements StateAssets {

  gamepad: VirtualGamepad;
  stagePointer: ClickableContainer<PIXI.Container>;

  userPrompt = new PIXI.BitmapText('', fonts.list);


  constructor() {
    this.gamepad = new VirtualGamepad();

    this.stagePointer = new ClickableContainer(Game.scene.visualLayers.stage);
    this.stagePointer.enabled = true;
    
    // TODO At some point there will be a background, soo use that.
    const clickableObj = new PIXI.Sprite(PIXI.Texture.EMPTY);
    clickableObj.width = Game.display.renderWidth;
    clickableObj.height = Game.display.renderHeight;
    Game.scene.visualLayers.stage.addChild(clickableObj);

    // Positioning variable
    const screenCenter = new Point(
      Game.display.renderWidth/2,
      Game.display.renderHeight/2,
    );

    // Add above-menu, prompt text
    this.userPrompt.anchor.set(.5, 0);
    this.userPrompt.x = screenCenter.x;
    this.userPrompt.y = 4;
    Game.scene.visualLayers.hud.addChild(this.userPrompt);
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
    this.userPrompt.text = '';
  }

  destroy(): void {
    this.stagePointer.destroy();
  }
}