import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { ViewSide } from "../../ui-windows/generic-components/UiEnums";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";


interface Options {
  location: Point;
  side: ViewSide;
}

export class FlareLaunchEvent extends TileEvent {

  protected options: Options;


  constructor(options: Options) {
    super(options.location);
    this.options = options;
  }

  protected create(): void {
    const { location, side } = this.options;

    const tileSize = Game.display.standardLength;
    const worldLocation = location.multiply(tileSize);
    if (side === ViewSide.Right)
      worldLocation.x += tileSize/2;

    const sheet = Game.scene.resources['VFXSpritesheet'].spritesheet as PIXI.Spritesheet;
    const animations = sheet.animations;

    // Cannon blast
    const blast = new PIXI.AnimatedSprite(animations['flare/flare-shot']);
    blast.animationSpeed = 1/4;
    blast.position.set(worldLocation.x, worldLocation.y);
    blast.loop = false;
    blast.play();

    blast.onComplete = () => {
      blast.destroy();
      this.finish();
    };

    // Add to scene
    MapLayer('ui').addChild(blast);
  }

  protected update(): void {

  }

  protected destroy(): void {

  }

}