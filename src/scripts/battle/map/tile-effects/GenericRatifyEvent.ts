import { Point } from "../../../Common/Point";
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

  constructor(options: GenericRatifyEventOptions) {
    super(options.location);
    this.options = options;
  }

  protected create(): void {
    this.options.ratify.call(this.options.context);
    this.finish();
  }

  protected update(): void {}

  protected destroy(): void {
    //@ts-expect-error
    this.options = undefined;
  }
}