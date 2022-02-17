import { Game } from "../../../..";
import { Ease } from "../../../Common/EaseMethod";
import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";


interface SiloLaunchEventOptions {
  location: Point;
}

export class SiloLaunchEvent extends TileEvent {
  
  protected options: SiloLaunchEventOptions;
  private rocket!: PIXI.AnimatedSprite;

  constructor(options: SiloLaunchEventOptions) {
    super(options.location);
    this.options = options;
  }

  protected create(): void {
    const { location } = this.options;

    const sheet = Game.scene.resources['VFXSpritesheet'].spritesheet as PIXI.Spritesheet;
    const textures = sheet.animations['silo-rocket'];

    this.rocket = new PIXI.AnimatedSprite(textures);
    this.rocket.animationSpeed = 1/4;
    this.rocket.position.set(
      location.x * 16,
      location.y * 16 + 8,
    )
    this.rocket.play();

    MapLayer('ui').addChild(this.rocket);

    // TODO Use camera height as the displace number?

    Timer
      .tween(1, this.rocket, {y: this.rocket.y - 256}, Ease.quint.in)
      .wait()
      .do(n => this.finish())
  }

  protected update(): void {

  }

  protected destroy(): void {
    this.rocket.destroy({children: true});
  }

}