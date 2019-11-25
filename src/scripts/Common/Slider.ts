import { Common } from "../CommonUtils";

type SliderOptions = {
    min?: number,
    max?: number,
    value?: number,
    granularity?: number,       // Probably not going to bother, but would determine the increment size if implemented.
    output?: (v: number) => number
}

/**  */
export class Slider {
    private _value: number;  // The value of this slider. Clamped between min and max.
    readonly min: number;    // The lower-end value to clamp between.
    readonly max: number;    // The higher-end value to clamp between.
    readonly granularity: number;           // The level of detail exhibited by the slider itself (the increment amount, essentially).
    readonly shape: (v: number) => number; // The behaviour function. This is used to shape the slider's input (a linear value) to some output.
    readonly outputPrecision: number;       // The level of detail exhibited by the slider's output. By default, off, but otherwise used to round values to the nearest multiple.

    constructor( options: {
                min?: number,
                max?: number,
                value?: number,
                granularity?: number,
                shape?: (v: number) => number,
                outputPrecision?: number
            } = {} ) {

        this.min = options.min || 0;
        this.max = options.max || 1;
        this._value = options.value || this.min;
        this.granularity = Math.abs(options.granularity || 0.01);       // By default, hundredths.
        this.shape = options.shape || ((v) => { return v; });           // By default, linear.
        this.outputPrecision = Math.abs(options.outputPrecision || 0);  // By default, 0 means off.

        console.assert(this.min <= this.max, `Slider was given conflicting min/max values: min=${this.min}, max=${this.max}`);
    }

    /** The value of the slider's tracked position as shaped by the slider's shaping function. */
    get shapedValue() {
        return this.applyGrain(this.shape(this._value), this.outputPrecision);
    }

    /** The value of the slider's tracked position. Between slider.min and .max by definition. */
    get value() { return this._value; }
    set value(n: number) {
        let v = this.applyGrain(n, this.granularity);       // Lose detail by slider granularity.
        this._value = Common.confine(v, this.min, this.max);// Limit range to slider min/max.
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