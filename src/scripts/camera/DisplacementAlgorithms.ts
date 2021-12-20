import { ViewRectVector } from "./ViewRect";


/** Accepts a vector ViewRect: last displacement */
export interface DisplacementAlgorithm {
  /** Returns a view rect vector. */
  get(): ViewRectVector;
}

export class ScreenShake implements DisplacementAlgorithm {
  private dir = -1;

  get() {
    this.dir = -this.dir;
    const vector = new ViewRectVector();
    vector.position.y = 2 * this.dir;
    return vector;
  }
}