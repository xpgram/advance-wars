import { Common } from "../CommonUtils";
import { Debug } from "../DebugUtils";

/**  */
export class Slider {
    private _track: number = 0;     // The value of this slider. Clamped between min and max.
    readonly min: number;           // The lower-end value to clamp between.
    readonly max: number;           // The higher-end value to clamp between.
    readonly granularity: number;   // The level of detail exhibited by the slider itself (the increment amount, essentially).
    readonly outputFunction: (v: number) => number; // The behaviour function. This is used to shape the slider's input (a linear value) to some output.
    readonly outputPrecision: number;               // The level of detail exhibited by the slider's output. By default, off, but otherwise used to round values to the nearest multiple.
    incrementFactor: number;        // How far and in which direction the slider should increment by default.
    looping: boolean;               // Whether incrementing past an end clamps or loops around to the other end.
    bouncing: boolean;              // Whether incrementing past an end should change the auto-increment direction.

    constructor( options: {
                min?: number,
                max?: number,
                track?: number | 'min' | 'max',
                granularity?: number,
                shape?: (v: number) => number,
                outputPrecision?: number,
                incrementFactor?: number,
                looping?: boolean,
                bouncing?: boolean
            } = {} ) {

        this.min = options.min || 0;
        this.max = options.max || 1;
        this._track = (options.track === 'max') ? this.max : this.min;
        if (typeof options.track === 'number')
            this.track = options.track;
        
        this.granularity = Math.abs(options.granularity || 0.1);        // By default, tenths.
        this.outputFunction = options.shape || ((v) => { return v; });  // By default, linear.
        this.outputPrecision = Math.abs(options.outputPrecision || 0);  // By default, 0 off.
        this.incrementFactor = options.incrementFactor || 1;        // By default, single.
        this.looping = options.looping || false;
        this.bouncing = options.bouncing || false;

        Debug.assert(this.min < this.max, `Slider was given conflicting min/max values: min=${this.min}, max=${this.max}`);
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
        this._track = n;

        // Looping value block——do this before applying grain since min/max are not subject to it. (Shouldn't they be?)
        if (this.looping) {
            let quotient = this._track / this.range;
            this._track = this.min + this.range * (quotient - Math.floor(quotient));
        }
        // Bouncing value block——bounce only off of hard limits; looping removes these hard limits.
        else if (this.bouncing) {
            if (this.equalsBoundary())
                this.incrementFactor = -this.incrementFactor;
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

    /** Sets the track position to some ratio of its range within its boundaries. */
    setByProportion(n: number) {
        this.track = n * this.range + this.min;
    }

    /** Increments the slider the given number of times by the slider's granularity (use negative numbers to decrement.)
     * Increases the track-value by +1 granules by default. You may set incrementFactor as a substitute to (or in addition
     * to) setting the times parameter. */
    increment(times: number = 1) {
        this.track += this.granularity * this.incrementFactor * times;
    }

    /** Decrements the slider the given number of times by the slider's granularity (use negative numbers to increment.)
     * Decreases the track-value by 1 granules by default. You may set incrementFactor as a substitute to (or in addition
     * to) setting the times parameter. */
    decrement(times: number = 1) {
        this.track -= this.granularity * this.incrementFactor * times;
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