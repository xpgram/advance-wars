import { Slider } from "../Common/Slider";
import { ViewRectVector } from "./ViewRect";


/** Accepts a vector ViewRect: last displacement */
export interface DisplacementAlgorithm {
  /** Returns a view rect vector. */
  get(): ViewRectVector;
}


export class ScreenShake implements DisplacementAlgorithm {
  private screenShakeSlider = new Slider({
    max: 4,
    track: 'max',
    granularity: 1/3,
    shape: v => Math.ceil(.33*v) * ((Math.ceil(v) % 2 === 0) ? 1 : -1),
    // shape: v => Math.round(Math.cos(2*v*Math.PI) * .75*v),
  });

  get() {
    const vector = new ViewRectVector();
    vector.position.y = this.screenShakeSlider.output;
    this.screenShakeSlider.decrement();
    return vector;
  }
}