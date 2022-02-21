import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
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

  constructor(options: SiloImpactEventOptions) {
    super(options.location);
    this.options = options;
  }

  private ratify(loc: Point) {
    const { map } = this.options.assets;

    // TODO I actually want to ratify each tile position individually.
    // I need to setup a batching system that will start a set of timers
    // that each describe their own ratify event.

    // This is animation stuff. Trying to orchestrate the spread-out blow-up effect.
    // TODO createTimer(loc: Point, delay: seconds): Timer
    // TODO getTimers(origin: Point, map: RegionMap, dist: number): Timer[]
    // All region map points of manhattan distance dist will have animation
    // timers created, configured and returned as a batch list.

    // Animation stages
    // - Rocket comes down
    // - Impact immediately starts:
    //   - ground explosion at center tile
    //   - white, expanding ring
    //   - crazy shake
    //   - brief whiteout (bright light effect)
    // - in timed stages after impact:
    //   - tiles of manhattan distance n begin their ground explosions

    const minHP = 10;
    const dmg = Command.LaunchSilo.damage;

    const unit = map.squareAt(loc).unit;
    if (unit && unit.hp > minHP)
      unit.hp = Math.max(minHP, unit.hp - dmg);
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
      worldLocation.y - 256
    );
    this.rocket.scale.y = -1;
    this.rocket.play();

    // Ground Explosions
    const createExplosion = (p: Point) => {
      const world = p.multiply(Game.display.standardLength);
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
      const explosionSet = region.points
        .filter( p => p.manhattanMagnitude() === i )
        .map( p => createExplosion(p.add(location)) );
      this.explosionStages.push(explosionSet);
    }

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

    // TODO Use camera height as the displace number
    // TODO Also, maybe not here(..?), but due to the very vertical animation,
    // I need the camera positioning system to demand more surrounding space.

    Timer
      .tween(.5, this.rocket, {y: worldLocation.y})
      
      .wait()
      .do(n => this.rocket.destroy({children: true}))

      .wait(.1).do(n => triggerExplosionSet(0))
      .wait(.1).do(n => triggerExplosionSet(1))
      .wait(.1).do(n => triggerExplosionSet(2))

      .wait(.5)
      .do(this.finish, this);
  }

  protected update(): void {

  }

  protected destroy(): void {
    
  }

}
