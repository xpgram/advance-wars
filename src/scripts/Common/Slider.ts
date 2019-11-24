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
        this.granularity = options.granularity || 0.01;         // By default, hundredths.
        this.shape = options.shape || ((v) => { return v; });   // By default, linear.
        this.outputPrecision = options.outputPrecision || 0;    // By default, 0 means off.

        console.assert(this.min <= this.max, `Slider was given conflicting min/max values: min=${this.min}, max=${this.max}`);
    }

    get shapedValue() {
        return this.applyGrain(this.shape(this._value), this.outputPrecision);
    }

    get value() { return this._value; }
    set value(n: number) {
        let v = Common.confine(n, this.min, this.max);      // Limit input
        this._value = this.applyGrain(v, this.granularity); // Limit to granularity.
    }

    // Users might think increment(100) means "increase by 100"
    // Either increment(n) should mean "increase n times", which is sort of intuitive-ish, or
    // increment(?) should not use positive/negative numbers to determine which direction to move in.
    increment(dir?: number) {
        let d = dir || 1;
        this.value += (d >= 0) ? this.granularity : -this.granularity;
    }

    decrement() {
        this.value += this.granularity;
    }

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