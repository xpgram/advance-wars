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

    const g = new PIXI.Graphics();
    g.beginFill(0xFFFFFF);
    g.drawRect(0,0,8,16);
    g.endFill();

    this.rocket = new PIXI.Container();
    this.rocket.position.set(
      location.x * 16,
      location.y * 16,
    )
    this.rocket.addChild(g);
    MapLayer('ui').addChild(this.rocket);

    Timer
      .tween(.8, this.rocket, {y: this.rocket.y - 256}, Ease.cbcirc.in)
      .wait()
      .do(n => this.finish())
  }

  protected update(): void {

  }

  protected destroy(): void {
    this.rocket.destroy({children: true});
  }

}