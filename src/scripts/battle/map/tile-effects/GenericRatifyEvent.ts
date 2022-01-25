import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { TileEvent } from "./TileEvent";

interface GenericRatifyEventOptions {
  location: Point,
  ratify: () => void,
  context?: object,
}

/** Calls the given callback function under the given context and immediately advances to next.
 * This event is intended for simple, non-animated board changes, particularly for the purpose of
 * prototyping. */
export class GenericRatifyEvent extends TileEvent {
  
  private options: GenericRatifyEventOptions;
  private timer = new Timer(.2, () => { this.finish(); });

  constructor(options: GenericRatifyEventOptions) {
    super(options.location);
    this.options = options;
  }

  protected create(): void {
    this.options.ratify.call(this.options.context);
    this.timer.start();
  }

  protected update(): void {}

  protected destroy(): void {
    //@ts-expect-error
    this.options = undefined;
    this.timer.destroy();
  }
}