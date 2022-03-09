import { Game } from "../../../..";
import { Ease } from "../../../Common/EaseMethod";
import { ImmutablePointPrimitive, Point } from "../../../Common/Point";
import { AnimatedSpriteConfigurators, AnimatedSpritePresets } from "../../../system/vfx-components/AnimatedSpritePresets";
import { Timer } from "../../../timer/Timer";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { MapLayer } from "../MapLayers";
import { Terrain } from "../Terrain";
import { TileEvent } from "./TileEvent";


interface SiloLaunchEventOptions {
  location: Point;
  terrain: Terrain.Silo
}

export class SiloLaunchEvent extends TileEvent {
  
  protected options: SiloLaunchEventOptions;
  private rocket!: PIXI.AnimatedSprite;
  private exhaustStages!: PIXI.AnimatedSprite[];

  constructor(options: SiloLaunchEventOptions) {
    super(options.location);
    this.options = options;
  }

  ratify(): void {
    const { terrain } = this.options;
    terrain.used = true;
  }

  protected create(): void {
    const { location } = this.options;

    const tileSize = Game.display.standardLength;
    const tileAlignment = new Point(-3,5);
    const worldLocation = location.multiply(tileSize).add(tileAlignment);

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
    const textures = animations['silo-exhaust'];
    textures.push(PIXI.Texture.EMPTY);

    const config = (textures: PIXI.Texture[]) => AnimatedSpriteConfigurators.progressiveTransparency({
      textures,
      animationSpeed: 1/12,
      alphaFloor: .35,
    });

    this.exhaustStages = [
      config(textures),
      config(textures),
      config(textures),
      config(textures),
    ].map( a => { a.alpha = 0; return a; });

    const startExhaust = (n: number, pos: ImmutablePointPrimitive) => {
      const anim = this.exhaustStages[n];
      anim.position.set(pos.x, pos.y);
      anim.alpha = 1;
      anim.play();
    }

    // Add to scene
    MapLayer('ui').addChild(this.rocket, ...this.exhaustStages);

    // TODO Use camera height as the displace number?

    Timer
      .do(this.ratify, this)
      .tween(1, this.rocket, {y: this.rocket.y - 256}, Ease.quad.in)

      .wait(.1).do(n => startExhaust(0, this.rocket))
      .wait(.1).do(n => startExhaust(1, this.rocket))
      .wait(.1).do(n => startExhaust(2, this.rocket))
      .wait(.1).do(n => startExhaust(3, this.rocket))

      .at('end')
      .do(this.finish, this)
  }

  protected update(): void {

  }

  protected destroy(): void {
    this.rocket.destroy({children: true});
  }

}