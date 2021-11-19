import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { TileEventType } from "./TileEventType";

/** Simple increment-on-request handler for individual TileEvents. */
export class TileEventQueue {

  /** The list of TileEvents queued for play. */
  private list: TileEventType[] = [];
  /** Reference to the game's scene assets. */
  private assets: BattleSceneControllers;

  constructor(assets: BattleSceneControllers) {
    this.assets = assets;
  }

  destroy() {
    //@ts-expect-error
    this.assets = undefined;
  }

  /** Add a new event(s) to the queue for playing. */
  add(...event: TileEventType[]) {
    //@ts-expect-error  // Forcibly add reference to game assets. // TODO There are other ways of doing this.
    event.forEach( e => e._assets = this.assets);
    this.list.push(...event);
  }

  /** Returns the current event to be played. */
  get current(): TileEventType | undefined {
    if (this.list.length > 0)
      return this.list[0];
  }

  /** Discards the current event and shifts focus to the next in sequence. */
  next() {
    this.current?.stop();
    this.list.shift();
  }
}