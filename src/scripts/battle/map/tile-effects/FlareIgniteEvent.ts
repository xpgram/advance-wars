import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { Command } from "../../turn-machine/Command";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";


interface Options {
  location: Point;
  assets: BattleSceneControllers;
}

// TODO Improving TileEvent
// [ ] this.container which auto destroys on this.destroy()
//     Don't want to destroy? Don't use this.container.
// [ ] Automatically figure worldLocation from set location point
// [ ] Auto-implement this.ratify()? How do I control when it gets called?
//     I don't know if this one is important.

export class FlareIgniteEvent extends TileEvent {

  protected options: Options;


  constructor(options: Options) {
    super(options.location);
    this.options = options;
  }


  private ratify(): void {
    const { map } = this.options.assets;
    const { location } = this.options;

    Command.Flare.effectAreaMap.points.forEach( p => {
      const loc = p.add(location);
      if (!map.validPoint(loc))
        return;
      map.squareAt(loc).hiddenFlag = false;
    })
  }

  protected create(): void {
    const { location } = this.options;

    const tileSize = Game.display.standardLength;
    const descendDistance = tileSize*2;

    const worldLocation = location.multiply(tileSize);
    worldLocation.y += -descendDistance + tileSize/2;

    const textures = Game.scene.texturesFrom('VFXSpritesheet');
    const animations = Game.scene.animationsFrom('VFXSpritesheet');

    // Descending spark
    const sparkAnim = (variant: string) => animations[`flare/flare-shimmer-${variant}`];
    const sparkSets = {
      start: sparkAnim('spark'),
      bright: sparkAnim('bright'),
      mid: sparkAnim('mid'),
      dim: sparkAnim('dim'),
    }
    const spark = new PIXI.AnimatedSprite(sparkSets.start);
    spark.animationSpeed = 1/3;
    spark.position.set(worldLocation.x + tileSize/2, worldLocation.y);
    spark.loop = false;

    const startSpark = () => {
      spark.alpha = 1;
      spark.play();
    }
    const changeSpark = (anim: PIXI.Texture[]) => {
      spark.textures = anim;
      spark.loop = true;
      spark.play();
    }

    //
    //
    //

    // Add to scene
    MapLayer('ui').addChild(spark);

    // Animation Schedule
    const time = 1.5;
    const timeInit = .25;
    Timer
      .tween(time + timeInit, spark, {y: spark.y + descendDistance})
      .do(n => startSpark())  // This needs to happen after the whoosh effect

      .at(timeInit)
      .do(n => changeSpark(sparkSets.bright))
      .wait(time/3)
      .do(n => changeSpark(sparkSets.mid))
      .wait(time/3)
      .do(n => changeSpark(sparkSets.dim))

      .at('end')
      .do(this.ratify, this)
      .do(n => spark.destroy())   // Move to this.destroy() or something
      .do(this.finish, this);
  }

  protected update(): void {

  }

  protected destroy(): void {

  }

}