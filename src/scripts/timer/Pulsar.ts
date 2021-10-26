import { Game } from "../..";

type PulsarOptions = {
  interval: number,
  firstInterval?: number,
}

/** 
 * Given a callable function and a frequency, recurringly calls the given function over a set interval.
 * Does not pulse on first update.
 * @interval The number of frames between calls.
 * @action The function callback.
 * @context The object to which this action is relevant, if such an object is necessary.
 */
export class Pulsar {

  /** Whether or not this pulsar is actively pulsing. */
  get active() { return this._active; }
  private _active = false;

  /** Whether or not this pulsar's first interval has finished. */
  private firstIntervalComplete = false;

  /** This class' internal measure of elapsed time in frames. */
  private clock = 0;

  /** The elapsed time between pulses. Measured in frames. */
  interval: number;

  /** The elapsed time between clock start and the first pulse. Measured in frames. */
  firstInterval: number;

  /** Pulses per second. Modifies interval to achieve the value set. */
  get frequency(): number {
    return 60 / this.interval;
  }
  set frequency(n) {
    this.interval = 60 / n;
  }

  /** A reference to the method we are to call every pulse. */
  private action: Function;
  /** A reference to the object this action is attached to, if applicable. */
  private context: Object | null;

  constructor(interval: PulsarOptions | number = 0, action: Function, context?: Object) {
    const isOptions = (typeof interval !== 'number');
    const options = (isOptions) ? interval : { interval };

    this.interval = options.interval;
    this.firstInterval = options.firstInterval || this.interval;
    this.action = action;
    this.context = context || null;
    Game.app.ticker.add(this.update, this);
  }

  /** Stops this pulsar from pulsing by removing its integration with the Game's main ticker. */
  destroy() {
    Game.app.ticker.remove(this.update, this);
  }

  /** Updates the internal clock, and emits a function call to self.action on pulse interval. */
  update(delta: number) {
    if (!this.active)
      return;

    const effectiveInterval = (this.firstIntervalComplete)
      ? this.interval
      : this.firstInterval;

    // Handle time
    this.clock += delta;
    if (this.clock > effectiveInterval) {
      this.clock -= effectiveInterval;
      this.firstIntervalComplete = true;
      this.action.call(this.context);
    }
  }

  /** Starts the pulsing loop-interval. */
  start() {
    this._active = true;
  }

  /** Stops the pulsing loop-interval and resets the clock. */
  stop() {
    this._active = false;
    this.reset();
  }

  /** Resets the clock, starts the counter over.
   * Does not stop the clock's ticking. */
  reset() {
    this.clock = 0;
    this.firstIntervalComplete = false;
  }
}