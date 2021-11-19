import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";


export class SupplyEvent extends TileEvent {
  protected timer: Timer = new Timer(2);

  image!: PIXI.Sprite;

  protected create(): void {
    const sheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;
    const onLeft = false;
    const imgTitle = `bubble-supply-${onLeft ? 'left' : 'right'}.png`;
    const tex = sheet.textures[imgTitle];
    this.image = new PIXI.Sprite(tex);

    const placement = new Point(this.location);
    placement.x += (onLeft) ? 0 : 1;

    this.image.anchor.x = (onLeft) ? 1 : 0;
    this.image.position.set(
      placement.x * Game.display.standardLength,
      placement.y * Game.display.standardLength,
    );

    MapLayer('ui').addChild(this.image);
  }

  protected update(): void {
    // TODO Oscillate up/down
  }

  protected destroy(): void {
    this.image.destroy();
    //@ts-expect-error
    this.image = undefined;
  }

}