import { Point } from "../../../Common/Point";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { TileEvent } from "./TileEvent";


interface RevealNeighborsEventOptions {
  location: Point,
  assets: BattleSceneControllers,
}

/** Reveals any hidden units adjacent to the event location. */
export class RevealNeighborsEvent extends TileEvent {

  private options: RevealNeighborsEventOptions;

  constructor(options: RevealNeighborsEventOptions) {
    super(options.location);
    this.options = options;
  }

  protected create(): void {
    const { map } = this.options.assets;
    const { location } = this.options;
    map.neighborsAt(location)
      .orthogonals
      .forEach( square => square.hideUnit = false );
    this.finish();
  }

  protected update(): void { }
  protected destroy(): void { }

}
