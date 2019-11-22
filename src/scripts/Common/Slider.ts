import { Common } from "../CommonUtils";

type SliderOptions = {
    min?: number,
    max: number,
    value?: number,
    granularity?: number        // Probably not going to bother, but would determine the increment size if implemented.
}

export class Slider {
    private _value: number;  // The value of this slider. Clamped between min and max.
    readonly min: number;    // The lower-end value to clamp between.
    readonly max: number;    // The higher-end value to clamp between.

    constructor( options: SliderOptions ) {
        this.min = options.min || 0;
        this.max = options.max;
        this._value = options.value || this.min;
    }

    get value() { return this._value; }
    set value(n: number) { this._value = Common.confine(n, this.min, this.max); }
}