import { Spritesheet } from "pixi.js";
import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";

export abstract class ExplosionEvent extends TileEvent {
  protected abstract title: string;

  protected timer: Timer = new Timer(0.8);
  image!: PIXI.Sprite;

  protected create(): void {
    const tileSize = Game.display.standardLength;

    const boardPos = new Point(this.location);
    const worldPos = boardPos.multiply(tileSize);
    
    const sheet = Game.scene.resources[`VFXSpritesheet`].spritesheet as Spritesheet;
    const textures = sheet.animations[`explosion-${this.title}`];
    this.image = new PIXI.AnimatedSprite(textures);

    this.image.position.set(worldPos.x, worldPos.y);
    this.image.animationSpeed = 1 / 2;
    this.image.play();

    MapLayer('ui').addChild(this.image);
  }

  protected update(): void {
    
  }

  protected destroy(): void {
    this.image?.destroy();
    //@ts-expect-error
    this.image = undefined;
  }
}