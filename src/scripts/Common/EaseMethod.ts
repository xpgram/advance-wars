import { Common } from "../CommonUtils";

/**  */
export type EaseFunction = (n: number) => number;

/**  */
class EaseSet {
  shape: EaseFunction;

  private inShape: EaseFunction;    // I guess this isn't as easy as I was hoping.
  private outShape: EaseFunction;   // I think just these two should be fine.
                                    // The reverse flipping is what was causing me problems.

  constructor(shape: EaseFunction) {
    this.shape = shape;
  }

  in(n: number): number {
    n = Common.clamp(n, 0, 1);
    return -this.shape(n-1) + 1;
  }

  out(n: number): number {
    n = Common.clamp(n, 0, 1);
    return this.shape(n);
  }

  inOut(n: number): number {
    n *= 2;
    return (n < 1) ? this.in(n)*.5 : this.out(n-1)*.5 + .5;
  }

  outIn(n: number): number {
    n *= 2;
    return (n < 1) ? this.out(n)*.5 : this.in(n-1)*.5 + .5;
  }
}

/**  */
export module EaseMethod {

  export const linear = new EaseSet(n => n);
  export const quad   = new EaseSet(n => n*n);
  export const cubic  = new EaseSet(n => Math.pow(n, 3));
  export const quart  = new EaseSet(n => Math.pow(n, 4));
  export const quint  = new EaseSet(n => Math.pow(n, 5));

  export const sqrt   = new EaseSet(n => Math.sqrt(n));
  export const cbrt   = new EaseSet(n => Math.cbrt(n));
  export const qdrt   = new EaseSet(n => Math.sqrt(Math.sqrt(n)));

  // export const log    = new EaseSet(n => Math.l)

  export const circ = new EaseSet(n => -Math.sqrt(1-n*n) + 1);
  export const sine = new EaseSet(n => Math.sin(n * Math.PI * .5));
}