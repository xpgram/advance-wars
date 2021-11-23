import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";
import { TileEventQueue } from "./TileEventQueue";


export class SupplyEvent extends TileEvent {
  protected timer: Timer = new Timer(0.66);

  image!: PIXI.Sprite;

  protected create(): void {
    const { camera } = TileEventQueue.assets;
    const sheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;
    const onLeft = (camera.center.x > this.location.x);
    const imgTitle = `bubble-supply-${onLeft ? 'left' : 'right'}.png`;
    const tex = sheet.textures[imgTitle];
    this.image = new PIXI.Sprite(tex);

    const placement = new Point(this.location);
    placement.x += (onLeft) ? .15 : .85;

    this.image.anchor.x = (onLeft) ? 1 : 0;
    this.image.position.set(
      placement.x * Game.display.standardLength,
      (placement.y - .35) * Game.display.standardLength,
    );

    MapLayer('ui').addChild(this.image);
  }

  protected update(): void {
    // TODO Oscillate up/down
  }

  protected destroy(): void {
    this.image?.destroy();
    //@ts-expect-error
    this.image = undefined;
  }

}