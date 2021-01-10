import { Common } from "../CommonUtils";
import { Debug } from "../DebugUtils";

// Refactor primarily adjusts 'looping: true' to 'mode: 'loop'',
// although it does a few other things.
// This seems to break the game, however.

/* export */ type SliderOptions = {
    /** The minimum value for the slider's track. By default, 0. */
    min?: number,
    /** The maximum value for the slider's track. By default, 1. */
    max?: number,
    /** The starting value for the slider's track. By default, 'min'. */
    track?: number | 'min' | 'max',
    /** The precision of the value's track. Track will always be min plus some multiple of granularity. By default, 0.1. */
    granularity?: number,
    /** The value by which the slider will increment. Final track value will always conform to granularity. By default, equal to granularity. */
    increment?: number,
    /** The transformation function for the slider's track to its output value. Linear by default. */
    shape?: (v: number) => number,
    /** The precision of the slider's output value. By default, off, but will otherwise conform the slider's output to some multiple thereof. */
    outputPrecision?: number,
    /** How the slider should handle incrementing through its extremes. By default, 'clamp'.
     * @mode 'clamp' range-inclusive; track range is not extended.
     * @mode 'loop': max-exclusive; track range is extended in a saw-wave pattern.
     * @mode 'bounce': range-inclusive; track range is extended in a triangle-wave pattern. */
    mode?: 'clamp' | 'loop' | 'bounce',
}

/**  */
/* export */ class Slider {
    private _track: number = 0;     // The value of this slider. Clamped between min and max.
    direction: 1 | -1 = 1;          // Which direction auto-increment moves in. Used for 'bounce' mode.

    readonly min: number;           // The lower-end value to clamp between.
    readonly max: number;           // The higher-end value to clamp between.
    readonly granularity: number;   // The level of detail exhibited by the slider itself (the increment amount, essentially).
    readonly incrementValue: number;// The value by which the slider will be incremented.
    readonly outputFunction: (v: number) => number; // The behaviour function. This is used to shape the slider's input (a linear value) to some output.
    readonly outputPrecision: number;               // The level of detail exhibited by the slider's output. By default, off, but otherwise used to round values to the nearest multiple.
    readonly mode: string;          // Describes how the slider handles incrementing through its extremes.

    constructor( options: SliderOptions = {} ) {

        this.min = options.min || 0;
        this.max = options.max || 1;
        this._track = (options.track === 'max') ? this.max : this.min;
        if (typeof options.track === 'number')
            this.track = options.track;
        
        this.granularity = Math.abs(options.granularity || 0.1);        // By default, tenths.
        this.outputFunction = options.shape || ((v) => { return v; });  // By default, linear.
        this.outputPrecision = Math.abs(options.outputPrecision || 0);  // By default, 0 off.
        this.incrementValue = options.increment || this.granularity;    // By default, granularity.
        this.mode = options.mode || 'clamp';

        if (this.min > this.max)
            throw `Slider was given conflicting min/max values: min=${this.min}, max=${this.max}`;
    }

    /** The output value of the slider as determined by its track-position input. */
    get output() {
        return this.applyGrain(this.outputFunction(this._track), this.outputPrecision);
    }

    /** Returns the difference between this slider's maximum and minimum values. */
    get range() {
        return this.max - this.min; // Since min < max, always positive.
    }

    /** Returns true if this slider is set to its maximum value. */
    equalsMax() {
        return this._track == this.max;
    }

    /** Returns true if this slider is set to its minimum value. */
    equalsMin() {
        return this._track == this.min;
    }

    /** Returns true if this slider is set to either of its extremes. */
    equalsBoundary() {
        return this.equalsMax() && this.equalsMin();
    }

    /** The value of the slider's tracked position. Between slider.min and .max by definition. */
    get track() { return this._track; }
    set track(n: number) {
        const remainder = (n - this.min) % this.range;
        const iteration = Math.floor((n - this.min) / this.range);

        if (this.mode == 'loop') {
            this._track = this.min + remainder + this.range*Number(remainder < 0);
        }
        else if (this.mode == 'bounce') {
            const tmp = remainder + this.range*Number(remainder < 0);
            this._track = this.min + ((iteration % 2 == 0) ? tmp : this.range - tmp);
            
            // Slow-incrementing settings —— I need... a more comprehensive solution.
            if (this.equalsMax())
                this.direction = -1;
            else if (this.equalsMin())
                this.direction = 1;

            // iteration % 2 should determine direction
            // but track is capped to iteration = 1, or 0 maybe
            // Point is, increment() and set() are different, but they're treated the same.
        }

        this._track = this.applyGrain(this._track, this.granularity); // Lose detail by slider granularity.
        this._track = Common.confine(this._track, this.min, this.max);// Limit range to slider min/max.
    }

    /** Sets this slider's tracked position to its minimum value. */
    setToMin() {
        this._track = this.min;
    }

    /** Sets this slider's tracked position to its maximum value. */
    setToMax() {
        this._track = this.max;
    }

    /** Sets the track position to some ratio of its range within its boundaries.
     * n is expected to be a number between 0 and 1. */
    setByProportion(n: number) {
        this.track = n * this.range + this.min;
    }

    /** Increments the slider the given number of times by the slider's granularity (use negative numbers to decrement.)
     * Increases the track-value by +1 granules by default. You may set incrementFactor as a substitute to (or in addition
     * to) setting the times parameter. */
    increment(times: number = 1) {
        this.track += this.incrementValue * times * this.direction;
    }

    /** Decrements the slider the given number of times by the slider's granularity (use negative numbers to increment.)
     * Decreases the track-value by 1 granules by default. You may set incrementFactor as a substitute to (or in addition
     * to) setting the times parameter. */
    decrement(times: number = 1) {
        this.track -= this.incrementValue * times * this.direction;
    }

    /** Rounds the given number v to the nearest multiple of the number 'grain.'
     * This is used to limit numerical precision in cases it's needed. Use grain=0 to ignore grain. */
    private applyGrain(v: number, grain: number) {
        if (grain === 0)
            return v;
        // Round to the nearest multiple of grain.
        let n = v / grain;
        n = Math.round(n);
        n = n * grain;
        return n;
    }
}