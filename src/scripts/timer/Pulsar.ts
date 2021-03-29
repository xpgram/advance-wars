import { Game } from "../..";

// TODO Write this using Game.delta (system.time)

/** 
 * Given a callable function and a frequency, recurringly calls the given function over a set interval.
 */
export class Pulsar {
    /** Whether or not this pulsar is actively pulsing. */
    active = false;

    /** This class' internal measure of elapsed time in... frames, I think. */
    private clock = 0;

    /** The elapsed time between pulses. Measured in frames, I think. */
    interval: number;

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

    constructor(interval: number = 0, action: Function, context?: Object ) {
        this.interval = interval;
        this.action = action;
        this.context = context || null;
        Game.app.ticker.add( this.update, this );
    }

    /** Stops this pulsar from pulsing by removing its integration with the Game's main ticker. */
    destroy() {
        Game.app.ticker.remove( this.update, this );
    }

    /** Updates the internal clock, and emits a function call to self.action on pulse interval. */
    update(delta: number) {
        if (! this.active)
            return;

        // Handle time
        this.clock += delta;
        if (this.clock > this.interval) {
            this.clock -= this.interval;

            // Trigger emit
            if (this.context)
                this.action.call(this.context);
            else
                this.action();
        }
    }

    /** Starts the pulsing loop-interval. */
    start() {
        this.active = true;
    }

    /** Stops the pulsing loop-interval and resets the clock. */
    stop() {
        this.active = false;
        this.reset();
    }

    /** Resets the clock, starts the counter over.
     * Does not stop the clock's ticking. */
    reset() {
        this.clock = 0;
    }
}