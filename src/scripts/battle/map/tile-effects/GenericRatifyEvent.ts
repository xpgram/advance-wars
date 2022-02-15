import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { TileEvent } from "./TileEvent";

interface GenericRatifyEventOptions {
  location: Point,
  ratify: () => void,
  context?: object,
  present?: boolean,
}

/** Calls the given callback function under the given context and immediately advances to next.
 * This event is intended for simple, non-animated board changes, particularly for the purpose of
 * prototyping. */
export class GenericRatifyEvent extends TileEvent {
  
  private options: GenericRatifyEventOptions;
  private postTimer: Timer;

  constructor(options: GenericRatifyEventOptions) {
    super(options.location);
    this.options = options;
    const { present } = options;
    this.postTimer = new Timer()
      .at((present) ? .2 : 0)
      .do( n => this.options.ratify.call(this.options.context) )
      .at((present) ? .6 : 0)
      .do( n => this.finish() );
  }

  protected create(): void {
    this.postTimer.start();
  }

  protected update(): void {}

  protected destroy(): void {
    //@ts-expect-error
    this.options = undefined;
  }
}