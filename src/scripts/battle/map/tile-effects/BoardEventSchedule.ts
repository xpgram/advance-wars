import { TileEvent } from "./TileEvent";

/** Simple increment-on-request handler for individual TileEvents. */
export class BoardEventSchedule {

  /** The list of TileEvents queued for play. */
  readonly list: TileEvent[] = [];

  destroy() {
    //@ts-expect-error
    this.assets = undefined;
  }

  /** Add a new event(s) to the queue for playing. */
  add(...event: TileEvent[]) {
    this.list.push(...event);
  }

  /** Returns the current event to be played. */
  get current(): TileEvent | undefined {
    if (this.list.length > 0)
      return this.list[0];
  }

  /** Discards the current event and shifts focus to the next in sequence. */
  next() {
    this.list.shift();
  }
}