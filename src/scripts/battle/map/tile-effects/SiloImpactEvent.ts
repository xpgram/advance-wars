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

  constructor(options: SiloImpactEventOptions) {
    super(options.location);
    this.options = options;
  }

  private ratify() {
    const { map } = this.options.assets;
    const { location } = this.options;

    // TODO I actually want to ratify each tile position individually.
    // I need to setup a batching system that will start a set of timers
    // that each describe their own ratify event.

    // This is animation stuff. Trying to orchestrate the spread-out blow-up effect.
    // TODO createTimer(loc: Point, delay: seconds): Timer
    // TODO getTimers(origin: Point, map: RegionMap, dist: number): Timer[]
    // All region map points of manhattan distance dist will have animation
    // timers created, configured and returned as a batch list.

    const minHP = 10;
    const dmg = Command.LaunchSilo.damage;
    const regionMap = Command.LaunchSilo.effectAreaMap;

    regionMap.points.forEach( p => {
      const loc = p.add(location);
      const unit = map.squareAt(loc).unit;
      if (unit && unit.hp > minHP)
        unit.hp = Math.max(minHP, unit.hp - dmg);
    })
  }

  protected create(): void {
    const { location } = this.options;

    const tileSize = Game.display.standardLength;
    const worldLocation = location.multiply(tileSize);

    const sheet = Game.scene.resources['VFXSpritesheet'].spritesheet as PIXI.Spritesheet;
    const textures = sheet.animations['silo-rocket'];

    this.rocket = new PIXI.AnimatedSprite(textures);
    this.rocket.animationSpeed = 1/4;
    this.rocket.position.set(
      worldLocation.x,
      worldLocation.y + 8 - 256
    );
    this.rocket.scale.y = -1;
    this.rocket.play();

    MapLayer('ui').addChild(this.rocket);

    // TODO Use camera height as the displace number
    // TODO Also, maybe not here(..?), but due to the very vertical animation,
    // I need the camera positioning system to demand more surrounding space.

    Timer
      .tween(.4, this.rocket, {y: worldLocation.y})
      
      .wait()
      .do(n => this.rocket.destroy({children: true}))
      .do(this.ratify, this)

      .wait(.5)
      .do(this.finish, this);
  }

  protected update(): void {

  }

  protected destroy(): void {
    
  }

}