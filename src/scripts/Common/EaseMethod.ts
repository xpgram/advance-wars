import { Common } from "../CommonUtils";

/** A function that when given a linear number (ideally between 0 and 1) returns
 * a number corrosponding to some algebraic or geometric shape. */
export type EaseFunction = (n: number) => number;

/** Returns an object set of in/out ease methods given the in/out definitions. */
function constructEaseSet(options: {easeIn: EaseFunction, easeOut: EaseFunction}) {
  const { easeIn, easeOut } = options;

  const forceDomain = (n: number) => Common.clamp(n, 0, 1);

  // Matches each ease method up to each .5 half of n's 0–1 domain.
  const doublePath = (n: number, a: EaseFunction, b: EaseFunction) => {
    n = forceDomain(n) * 2;
    return (n < 1) ? a(n) * 0.5 : b(n-1) * 0.5 + 0.5;
  }

  const ease = {
    in: ((n: number) => easeIn(forceDomain(n)) ) as EaseFunction,
    out: ((n: number) => easeOut(forceDomain(n)) ) as EaseFunction,
    inOut: ((n: number) => doublePath(n, easeIn, easeOut) ) as EaseFunction,
    outIn: ((n: number) => doublePath(n, easeOut, easeIn) ) as EaseFunction,
  }

  Object.freeze(ease);
  return ease;
}

/**  */
export module Ease {

  export function quantize(f: EaseFunction, qvalue: number): EaseFunction {
    return (n: number) => Math.floor(f(n) * qvalue) / qvalue;
  }

  export const linear = constructEaseSet({
    easeIn: n => n,
    easeOut: n => n,
  });

  export const quad = constructEaseSet({
    easeIn: n => Math.pow(n, 2),
    easeOut: n => 1 - Math.pow(n-1, 2),
  });

  export const cubic = constructEaseSet({
    easeIn: n => Math.pow(n, 3),
    easeOut: n => 1 + Math.pow(n-1, 3),
  });

  export const quart = constructEaseSet({
    easeIn: n => Math.pow(n, 4),
    easeOut: n => 1 - Math.pow(n-1, 4),
  });

  export const quint = constructEaseSet({
    easeIn: n => Math.pow(n, 5),
    easeOut: n => 1 + Math.pow(n-1, 5),
  });


  export const sqrt = constructEaseSet({
    easeIn: n => 1 - Math.sqrt(-n + 1),
    easeOut: n => Math.sqrt(n),
  });

  export const cbrt   = constructEaseSet({
    easeIn: n => 1 - Math.cbrt(-n + 1),
    easeOut: n => Math.cbrt(n),
  });

  export const qdrt   = constructEaseSet({
    easeIn: n => 1 - Math.sqrt(Math.sqrt(-n + 1)),
    easeOut: n => Math.sqrt(Math.sqrt(n)),
  });


  // export const log    = constructEaseSet(n => Math.l)

  export const circ = constructEaseSet({
    easeIn: n => 1 - Math.sqrt(1 - Math.pow(n, 2)),
    easeOut: n => Math.sqrt(1 - Math.pow(n-1, 2)),
  });

  export const cbcirc = constructEaseSet({
    easeIn: n => 1 - Math.cbrt(1 - Math.pow(n, 3)),
    easeOut: n => Math.cbrt(1 + Math.pow(n-1, 3)),
  })

  
  export const sine = constructEaseSet({
    easeIn: n => 1 - Math.cos(n * Math.PI * 0.5),
    easeOut: n => Math.sin(n * Math.PI * 0.5),
  });


  const backCoeff = 5*Math.PI/8;
  const backSine = Math.sin(backCoeff);
  export const back = constructEaseSet({
    easeIn: n => Math.sin(n*n*backCoeff) / backSine,
    easeOut: n => n,  // I dunno. I gotta pee. I gotta work.
  });

}
