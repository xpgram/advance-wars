import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";
import { TileEventQueue } from "./TileEventQueue";


export class SupplyEvent extends TileEvent {
  protected timer: Timer = new Timer(0.7);

  image!: PIXI.Sprite;

  protected create(): void {
    const { camera } = TileEventQueue.assets;
    const sheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;
    const onLeft = (camera.center.x > this.location.x * Game.display.standardLength);
    const imgTitle = `bubble-supply-${onLeft ? 'right' : 'left'}.png`;
    const tex = sheet.textures[imgTitle];
    this.image = new PIXI.Sprite(tex);

    const placement = new Point(this.location);
    placement.x += (onLeft) ? .85 : .15;

    this.image.anchor.x = (onLeft) ? 0 : 1;
    this.image.position.set(
      placement.x * Game.display.standardLength,
      (placement.y - .35) * Game.display.standardLength,
    );
    this.image.visible = false;

    MapLayer('ui').addChild(this.image);
  }

  protected update(): void {
    if (this.timer.elapsed > 0.15)
      this.image.visible = true;
  }

  protected destroy(): void {
    this.image?.destroy();
    //@ts-expect-error
    this.image = undefined;
  }

}