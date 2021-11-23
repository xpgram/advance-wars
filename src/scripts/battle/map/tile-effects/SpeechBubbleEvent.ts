import { Spritesheet } from "pixi.js";
import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";
import { TileEventQueue } from "./TileEventQueue";


export abstract class SpeechBubbleEvent extends TileEvent {
  protected abstract title: string;

  protected timer: Timer = new Timer(0.8);
  image!: PIXI.Sprite;

  protected create(): void {
    const { camera } = TileEventQueue.assets;
    const tileSize = Game.display.standardLength;

    const boardPos = new Point(this.location);
    const worldPos = boardPos.multiply(tileSize);
    const leftsideViewport = (camera.center.x > worldPos.x);

    const sheet = Game.scene.resources['UISpritesheet'].spritesheet as Spritesheet;
    const tex = sheet.textures[`bubble-${this.title}-${leftsideViewport ? 'right' : 'left'}.png`];
    this.image = new PIXI.Sprite(tex);

    worldPos.x += (leftsideViewport) ? .8*tileSize : .2*tileSize;
    worldPos.y -= .5*tileSize;

    this.image.position.set(worldPos.x, worldPos.y);
    this.image.anchor.x = (leftsideViewport) ? 0 : 1;
    this.image.visible = false;

    MapLayer('ui').addChild(this.image);
  }

  protected update(): void {
    this.image.visible = (this.timer.elapsed > 0.2);
  }

  protected destroy(): void {
    this.image?.destroy();
    //@ts-expect-error
    this.image = undefined;
  }
}