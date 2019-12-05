import { Common } from "../CommonUtils";
import { Debug } from "../DebugUtils";

/**  */
export class Slider {
    private _value: number;  // The value of this slider. Clamped between min and max.
    readonly min: number;    // The lower-end value to clamp between.
    readonly max: number;    // The higher-end value to clamp between.
    readonly granularity: number;           // The level of detail exhibited by the slider itself (the increment amount, essentially).
    readonly shape: (v: number) => number;  // The behaviour function. This is used to shape the slider's input (a linear value) to some output.
    readonly outputPrecision: number;       // The level of detail exhibited by the slider's output. By default, off, but otherwise used to round values to the nearest multiple.
    autoIncrementFactor: number;    // How far and in which direction the slider should increment by default.
    looping: boolean;               // Whether incrementing past an end clamps or loops around to the other end.
    bouncing: boolean;              // Whether incrementing past an end should change the auto-increment direction.

    constructor( options: {
                min?: number,
                max?: number,
                value?: number | 'min' | 'max',
                granularity?: number,
                shape?: (v: number) => number,
                outputPrecision?: number,
                autoIncrementFactor?: number,
                looping?: boolean,
                bouncing?: boolean
            } = {} ) {

        this.min = options.min || 0;
        this.max = options.max || 1;
        this._value = (options.value = 'max') ? this.max : this.min;
        if (typeof options.value == 'number')
            this._value = options.value;
        
        this.granularity = Math.abs(options.granularity || 0.01);       // By default, hundredths.
        this.shape = options.shape || ((v) => { return v; });           // By default, linear.
        this.outputPrecision = Math.abs(options.outputPrecision || 0);  // By default, 0 off.
        this.autoIncrementFactor = options.autoIncrementFactor || 1;    // By default, single.
        this.looping = options.looping || false;
        this.bouncing = options.bouncing || false;

        Debug.assert(this.min < this.max, `Slider was given conflicting min/max values: min=${this.min}, max=${this.max}`);
    }

    /** The value of the slider's tracked position as shaped by the slider's shaping function. */
    get shapedValue() {
        return this.applyGrain(this.shape(this._value), this.outputPrecision);
    }

    /** The value of the slider's tracked position. Between slider.min and .max by definition. */
    get value() { return this._value; }
    set value(n: number) {
        this._value = n;

        // Looping value block——do this before applying grain since min/max are not subject to it. (Shouldn't they be?)
        if (this.looping) {
            let range = this.max - this.min;
            let quotient = this._value / range;
            this._value = this.min + range * (quotient - Math.floor(quotient));
        }
        // Bouncing value block——bounce only off of hard limits; looping removes these hard limits.
        else if (this.bouncing) {
            if (this._value >= this.max || this._value <= this.min)
                this.autoIncrementFactor = -this.autoIncrementFactor;
        }

        this._value = this.applyGrain(this._value, this.granularity); // Lose detail by slider granularity.
        this._value = Common.confine(this._value, this.min, this.max);// Limit range to slider min/max.
    }

    /** Increments the slider the given number of times by the slider's granularity (use negative numbers to decrement.)
     * Increases the track-value by +1 granules by default. */
    increment(times: number = 1) {
        this.value += this.granularity * times;
    }

    /** Decrements the slider the given number of times by the slider's granularity (use negative numbers to increment.)
     * Decreases the track-value by 1 granules by default. */
    decrement(times: number = 1) {
        this.value += this.granularity * times;
    }

    /** Increments however many times were set in whichever direction (positive or negative) was set.
     * Note that the precision in incrementing by decimal multiples is naturally lost to the slider's granularity. */
    autoIncrement() {
        this.value += this.granularity * this.autoIncrementFactor;
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