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
    granularity: 1/4,
    shape: v => Math.ceil(((v % 2 === 0) ? v : -v)*.5),
  });

  get() {
    const vector = new ViewRectVector();
    vector.position.y = this.screenShakeSlider.output;
    this.screenShakeSlider.decrement();
    return vector;
  }
}