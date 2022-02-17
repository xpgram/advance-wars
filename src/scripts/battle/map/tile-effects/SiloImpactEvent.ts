import { Point } from "../../../Common/Point";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { CommonRangesRetriever } from "../../unit-actions/RegionMap";
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

    // TODO createTimer(loc: Point, delay: seconds): Timer
    // TODO getTimers(origin: Point, map: RegionMap, dist: number): Timer[]
    // All region map points of manhattan distance dist will have animation
    // timers created, configured and returned as a batch list.

    // TODO Get dmg from Command.LaunchSilo.damage
    // TODO Get RegionMap from Command.LaunchSilo.effectMap
    const dmg = 30;
    const effectMap = CommonRangesRetriever({min:0,max:2});
    effectMap.points.forEach( p => {
      const loc = p.add(location);
      const unit = map.squareAt(loc).unit;
      if (unit)
        unit.hp -= dmg;
    })
  }

  protected create(): void {

  }

  protected update(): void {

  }

  protected destroy(): void {

  }

}