import { Game } from "../../../..";
import { Ease } from "../../../Common/EaseMethod";
import { ImmutablePointPrimitive, Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";


interface SiloLaunchEventOptions {
  location: Point;
}

export class SiloLaunchEvent extends TileEvent {
  
  protected options: SiloLaunchEventOptions;
  private rocket!: PIXI.AnimatedSprite;
  private exhaustStages!: PIXI.AnimatedSprite[];

  constructor(options: SiloLaunchEventOptions) {
    super(options.location);
    this.options = options;
  }

  protected create(): void {
    const { location } = this.options;

    const tileSize = Game.display.standardLength;
    const worldLocation = location.multiply(tileSize);

    const sheet = Game.scene.resources['VFXSpritesheet'].spritesheet as PIXI.Spritesheet;
    const animations = sheet.animations;

    // Rocket
    this.rocket = new PIXI.AnimatedSprite(animations['silo-rocket']);
    this.rocket.animationSpeed = 1/4;
    this.rocket.position.set(
      worldLocation.x,
      worldLocation.y,
    );
    this.rocket.play();

    // Exhaust
    this.exhaustStages = [
      new PIXI.AnimatedSprite(animations['silo-exhaust']),
      new PIXI.AnimatedSprite(animations['silo-exhaust']),
      new PIXI.AnimatedSprite(animations['silo-exhaust']),
      new PIXI.AnimatedSprite(animations['silo-exhaust']),
    ];
    this.exhaustStages.forEach( a => {
      a.textures.push(PIXI.Texture.EMPTY);
      a.animationSpeed = 1/16;
      a.alpha = 0;
    });

    const startExhaust = (n: number, pos: ImmutablePointPrimitive) => {
      const anim = this.exhaustStages[n];
      anim.position.set(pos.x, pos.y);
      anim.alpha = 1;
      anim.play();
      anim.loop = false;
      anim.onComplete = () => {
        anim.destroy();
      }
    }

    // Add to scene
    MapLayer('ui').addChild(this.rocket, ...this.exhaustStages);

    // TODO Use camera height as the displace number?

    Timer
      .tween(.8, this.rocket, {y: this.rocket.y - 256}, Ease.cubic.in)

      .do(n => startExhaust(0, this.rocket))
      .wait(.3)
      .do(n => startExhaust(1, this.rocket))
      .wait(.1)
      .do(n => startExhaust(2, this.rocket))
      .wait(.0667)
      .do(n => startExhaust(3, this.rocket))

      .at('end')
      .do(this.finish, this)
  }

  protected update(): void {

  }

  protected destroy(): void {
    this.rocket.destroy({children: true});
  }

}