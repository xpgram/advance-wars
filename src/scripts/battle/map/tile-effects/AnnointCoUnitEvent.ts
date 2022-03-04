import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { UnitObject } from "../../UnitObject";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";

interface Options {
  actor: UnitObject;
  location: Point;
  assets: BattleSceneControllers;
}

export class AnnointCoUnitEvent extends TileEvent {

  private options: Options;


  constructor(options: Options) {
    super(options.location);
    this.options = options;
  }

  protected ratify(): void {
    const { actor } = this.options;
    const { players } = this.options.assets;

    actor.CoOnBoard = true;
    actor.rank = 3;
    players.perspectivesTurn?.setCoBoardableIndicators();
    players.current.expendFunds(actor.cost);

    // TODO Update sight map if CO unit has ++vision?
  }

  protected create(): void {
    const { location } = this.options;

    const size = Game.display.standardLength;
    const worldLocation = location
      .multiply(size)
      .add(size/4, size*3/4);

    const tex = Game.scene.texturesFrom('UISpritesheet')['icon-co-badge.png'];
    const icon = new PIXI.Sprite(tex);
    icon.anchor.set(.5);
    icon.scale.set(2.2);
    icon.alpha = 0;
    icon.position.set(worldLocation.x, worldLocation.y);

    MapLayer('ui').addChild(icon);

    Timer
      .at(.2)
      .tween(.05, icon, {alpha: 1})
      .tween(.15, icon, {scale: {x: 1, y: 1}})

      .at('end')
      .wait(.4)
      .do(this.ratify, this)
      .do(n => icon.destroy())
      .do(this.finish, this)
  }

  protected update(): void {
    
  }

  protected destroy(): void {
    
  }

}