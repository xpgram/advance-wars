import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { TileEvent } from "./TileEvent";

/** Simple increment-on-request handler for individual TileEvents. */
export class TileEventQueue {

  /** The list of TileEvents queued for play. */
  static readonly list: TileEvent[] = [];
  /** Reference to the game's scene assets. */
  static assets: BattleSceneControllers;

  static init(assets: BattleSceneControllers) {
    this.assets = assets;
  }

  static destroy() {
    //@ts-expect-error
    this.assets = undefined;
  }

  /** Add a new event(s) to the queue for playing. */
  static add(...event: TileEvent[]) {
    this.list.push(...event);
  }

  /** Returns the current event to be played. */
  static get current(): TileEvent | undefined {
    if (this.list.length > 0)
      return this.list[0];
  }

  /** Discards the current event and shifts focus to the next in sequence. */
  static next() {
    this.current?.stop();
    this.list.shift();
  }
}