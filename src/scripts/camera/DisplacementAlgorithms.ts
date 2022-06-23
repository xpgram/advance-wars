import { Slider } from "../Common/Slider";
import { Common } from "../CommonUtils";
import { ViewRectVector } from "./ViewRect";


/** Accepts a vector ViewRect: last displacement */
export interface DisplacementAlgorithm {
  /** Returns a view rect vector. */
  get(): ViewRectVector;
}


export const CameraDisplacementMethod = Common.confirmType<DisplacementAlgorithm>() ({

  /** Vibrates the screen with diminishing intensity over time to simulate camera jostling
   * from impact, quake, etc. */
  ScreenShake: {
    screenShakeSlider: new Slider(),
    
    /** Sets the shake-intensity value, which is correlated with travel distance. A good default is 6.  
     * Returns `this` for simple camera assignment. */
    withIntensity(intensity: number) {
      this.screenShakeSlider = new Slider({
        max: intensity,
        track: 'max',
        granularity: 1/3,
        shape: v => Math.ceil(.33*v) * ((Math.ceil(v) % 2 === 0) ? 1 : -1),
        // shape: v => Math.round(Math.cos(2*v*Math.PI) * .75*v),
      })
      return this;
    },

    /** Sets the shake-intensity value, which is correlated with travel distance. A good default is 6. */
    setIntensity(intensity: number) {
      this.withIntensity(intensity);
    },
    
    get() {
      const vector = new ViewRectVector();
      vector.position.y = this.screenShakeSlider.output;
      this.screenShakeSlider.decrement();
      return vector;
    },
  },

});
