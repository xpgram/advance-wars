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
// [ ] Implement skipAnimation() which *requires* a ratify method.
//     This is *required* for online play (leave and reenter) unless I want to send
//     then entire board state every packet exchange.

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
    const { map } = this.options.assets;
    const { location } = this.options;

    const tileSize = Game.display.standardLength;
    const descendDistance = tileSize*2;
    const worldLocation = location.multiply(tileSize);

    const worldLocationCenter = worldLocation.add(tileSize/2);
    const descendLocation = worldLocationCenter.add(0, -descendDistance);

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
    spark.position.set(descendLocation.x, descendLocation.y);
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

    // Line-whip or w/e you call it
    const createActionLines = () => {
      const action = new PIXI.AnimatedSprite(animations['flare/flare-ignite']);
      action.animationSpeed = 1/4;
      action.position.set(spark.x, spark.y);
      action.loop = false;
      action.play();
      action.onComplete = () => action.destroy();
      MapLayer('ui').addChild(action);
    }

    // Smoke poof
    const createSmokePoof = () => {
      const poof = new PIXI.AnimatedSprite(animations['flare/flare-smoke-poof']);
      poof.animationSpeed = 1/8;
      poof.position.set(spark.x, spark.y);
      poof.loop = false;
      poof.play();
      poof.onComplete = () => poof.destroy();
      MapLayer('ui').addChild(poof);
    }

    // Light blast
    const lightBlast = new PIXI.Sprite(textures['flare/flare-blast.png']);
    lightBlast.position.set(worldLocationCenter.x, worldLocationCenter.y);
    lightBlast.scale.set(.1);
    lightBlast.alpha = 0;

    // Reveal ratify
    const reveal = (dist: number) => {
      const { map } = this.options.assets;

      Command.Flare.effectAreaMap.points.forEach( p => {
        if (p.manhattanMagnitude() !== dist)
          return;

        const loc = p.add(location);
        if (!map.validPoint(loc))
          return;

        map.squareAt(loc).hiddenFlag = false;
      })
    }

    // Add to scene
    MapLayer('ui').addChild(spark, lightBlast);

    // Animation Schedule
    const time = 1.5;
    const timeInit = .25;
    const blastTime = .5;
    Timer
      .wait(.3)
      .tween(time + timeInit, spark, {y: spark.y + descendDistance})
      .do(n => startSpark())
      .do(createActionLines)

      .at('end').label('descend-finish')

      .at(timeInit) // control for 
      .every({time: time/3, max: 2}, createSmokePoof)
      .do(n => changeSpark(sparkSets.bright))
      .wait(time/3)
      .do(n => changeSpark(sparkSets.mid))
      .wait(time/3)
      .do(n => changeSpark(sparkSets.dim))

      .at('descend-finish') // expanding light blast
      .do(n => spark.destroy())
      .do(n => lightBlast.alpha = 1)
      .tween(blastTime, lightBlast, {scale: {x: 1, y: 1}, alpha: 0})
      .wait()
      .do(n => lightBlast.destroy())

      .at('descend-finish') // expanding ratification
      .do(n => reveal(0))
      .wait(blastTime/3)
      .do(n => reveal(1))
      .wait(blastTime/3)
      .do(n => reveal(2))

      .at('end')
      .do(this.ratify, this)
      .do(this.finish, this);
  }

  protected update(): void {

  }

  protected destroy(): void {

  }

}