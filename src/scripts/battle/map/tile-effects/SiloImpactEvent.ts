import { Game } from "../../../..";
import { ScreenShake } from "../../../camera/DisplacementAlgorithms";
import { ImmutablePointPrimitive, Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { Command } from "../../turn-machine/Command";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";


interface SiloImpactEventOptions {
  location: Point;
  assets: BattleSceneControllers;
}

export class SiloImpactEvent extends TileEvent {
  
  protected options: SiloImpactEventOptions;
  private rocket!: PIXI.AnimatedSprite;
  private explosionStages: PIXI.AnimatedSprite[][] = [];
  private whiteout!: PIXI.Graphics;

  constructor(options: SiloImpactEventOptions) {
    super(options.location);
    this.options = options;
  }

  private ratify(loc: Point) {
    const { map } = this.options.assets;

    const minHP = 10;
    const dmg = Command.LaunchSilo.damage;

    const unit = map.squareAt(loc).unit;
    if (unit && unit.hp > minHP)
      unit.hp = Math.max(minHP, unit.hp - dmg);
  }

  protected create(): void {
    const { map, camera } = this.options.assets;
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
      worldLocation.y - 256
    );
    this.rocket.scale.y = -1;
    this.rocket.play();

    // Ground Explosions
    const createExplosion = (p: ImmutablePointPrimitive) => {
      const world = new Point(p).multiply(Game.display.standardLength);
      const anim = new PIXI.AnimatedSprite(animations['explosion-dry']);
      anim.animationSpeed = 1/4;
      anim.position.set(world.x, world.y);
      anim.alpha = 0;
      anim.loop = false;
      anim.onComplete = () => anim.destroy();
      return {anim, loc: p};
    }

    const region = Command.LaunchSilo.effectAreaMap;
    for (let i = 0; i < 3; i++) {
      const explosionSet = map.squaresFrom(location, region)
        .filter( s => location.manhattanDistance(s) === i )
        .map( s => createExplosion(s) )
      this.explosionStages.push(explosionSet);
    }

    // Whiteout
    this.whiteout = new PIXI.Graphics();
    this.whiteout.beginFill(0xFFFFFF);
    this.whiteout.drawRect(0,0,Game.display.renderWidth,Game.display.renderHeight);
    this.whiteout.endFill();
    this.whiteout.alpha = 0;
    this.whiteout.blendMode = PIXI.BLEND_MODES.LIGHTEN;

    // Called by Timer.events to trigger a set of staged explosion events
    const triggerExplosionSet = (n: number) => {
      this.explosionStages[n].forEach( d => {
        const { anim, loc } = d;
        anim.alpha = 1;
        anim.play();
        this.ratify(loc);
      })
    }

    // Add to scene
    MapLayer('ui').addChild(this.rocket, ...this.explosionStages.flat(3).map( d => d.anim ));
    Game.hud.addChild(this.whiteout);

    // TODO Use camera height as the displace number
    // Or, have the rocket fade out at the top since I have no way of knowing how zoomed out the player could possibly ever be.
    // TODO Also, maybe not here(..?), but due to the very vertical animation,
    // I need the camera positioning system to demand more surrounding space.

    // Setup camera shake
    const cameraSwap = camera.algorithms.displacement;
    const cameraShake = new ScreenShake(12);

    Timer
      .tween(.5, this.rocket, {y: worldLocation.y})
      
      .wait().label('impact')
      .do(n => this.rocket.destroy({children: true}))

      .at('impact')
      .tween(.15, this.whiteout, {alpha: .8})
      .wait()
      .tween(.15, this.whiteout, {alpha: 0})
      .wait()
      .do(n => this.whiteout.destroy())

      .at('impact')
      .do(n => camera.algorithms.displacement = cameraShake)

      .at('impact')
      .do(n => triggerExplosionSet(0))
      .wait(.15).do(n => triggerExplosionSet(1))
      .wait(.15).do(n => triggerExplosionSet(2))

      .at('end').wait(.5)
      .do(n => camera.algorithms.displacement = cameraSwap)
      .do(this.finish, this);
  }

  protected update(): void {

  }

  protected destroy(): void {

  }

}
