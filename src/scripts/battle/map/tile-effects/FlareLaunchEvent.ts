import { PIXI } from "../../../../constants";
import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
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
    blast.alpha = 0;

    blast.onComplete = () => {
      blast.destroy();
      this.finish();
    };

    // Add to scene
    MapLayer('ui').addChild(blast);

    // Animation schedule
    Timer
      .wait(.4)
      .do(n => {blast.alpha = 1; blast.play();})
      .wait(.6)
      .do(this.finish, this);
  }

  protected update(): void {

  }

  protected destroy(): void {

  }

}