import { ImmutablePointPrimitive, Point } from "../../../Common/Point";
import { TileEvent } from "./TileEvent";

/** Simple increment-on-request handler for individual TileEvents. */
export class BoardEventSchedule {

  /** The list of TileEvents queued for play. */
  readonly list: (TileEvent[])[] = [];

  destroy() {
    //@ts-expect-error
    this.assets = undefined;
  }

  /** Returns the current event to be played. */
  private get current(): TileEvent[] | undefined {
    if (this.list.length > 0)
      return this.list[0];
  }

  /** Returns the location on the board where this batch of events is taking place. */
  get boardLocation(): ImmutablePointPrimitive | undefined {
    const events = this.current;
    if (events)
      return events[0].location;
  }

  /** True if there are events in the schedule waiting to be played. */
  get eventsInQueue(): boolean {
    return (this.list.length > 0);
  }

  /** True if the current event batch is still animating. */
  get batchPlaying(): boolean {
    return this.current?.some( e => e.playing ) || false;
  }

  /** True if the current event batch has finished animating. */
  get batchFinished(): boolean {
    return this.current?.every( e => e.finished ) || false;
  }

  /** Add a new event(s) to the queue for playing. Submit events as a list object to indicate concurrency.
   * Optional events may be included via `(condition) && new Event({location})` which may yield false;
   * 'false' values will be filtered out and ignored. */
  schedule(...event: (TileEvent | TileEvent[] | false)[]) {
    const listEvents = event
      .filter( e => e !== false )
      .map( e => Array.isArray(e) ? e : [e] )
      .filter( e => e.length > 0 ) as TileEvent[][];
    if (listEvents.length > 0)
      this.list.push(...listEvents);
  }

  /** Sets the current event batch to start animating. */
  batchPlay() {
    if (!this.current)
      return;
    this.current.forEach( e => e.play() );
  }

  /** Discards the current event and shifts focus to the next in sequence. */
  next() {
    this.list.shift();
  }
}