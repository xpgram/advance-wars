import { Common } from "../CommonUtils";

/**  */
export type EaseFunction = (n: number) => number;

/**  */
class EaseSet {
  private easeIn: EaseFunction;
  private easeOut: EaseFunction;

  constructor(options: {easeIn: EaseFunction, easeOut: EaseFunction}) {
    this.easeIn = options.easeIn;
    this.easeOut = options.easeOut;
  }

  in(n: number): number {
    n = Common.clamp(n, 0, 1);
    return this.easeIn(n);
  }

  out(n: number): number {
    n = Common.clamp(n, 0, 1);
    return this.easeOut(n);
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

  // TODO EaseMethod.linear.out is meant to be passed in, but it requires context,
  // which means it has to be bounded. I guess we have to fix that here. *sigh*
  // Can I do a functional thing here? Maybe refactor the class up there out?
  // I'd prefer not to have to worry about binding stuff.

  export const linear = new EaseSet({
    easeIn: n => n,
    easeOut: n => n,
  });

  export const quad = new EaseSet({
    easeIn: n => Math.pow(n, 2),
    easeOut: n => 1 - Math.pow(n-1, 2),
  });

  export const cubic = new EaseSet({
    easeIn: n => Math.pow(n, 3),
    easeOut: n => 1 + Math.pow(n-1, 3),
  });

  export const quart = new EaseSet({
    easeIn: n => Math.pow(n, 4),
    easeOut: n => 1 - Math.pow(n-1, 4),
  });

  export const quint = new EaseSet({
    easeIn: n => Math.pow(n, 5),
    easeOut: n => 1 + Math.pow(n-1, 5),
  });


  export const sqrt = new EaseSet({
    easeIn: n => 1 - Math.sqrt(-n + 1),
    easeOut: n => Math.sqrt(n),
  });

  export const cbrt   = new EaseSet({
    easeIn: n => 1 - Math.cbrt(-n + 1),
    easeOut: n => Math.cbrt(n),
  });

  export const qdrt   = new EaseSet({
    easeIn: n => 1 - Math.sqrt(Math.sqrt(-n + 1)),
    easeOut: n => Math.sqrt(Math.sqrt(n)),
  });


  // export const log    = new EaseSet(n => Math.l)

  export const circ = new EaseSet({
    easeIn: n => 1 - Math.sqrt(1 - Math.pow(n, 2)),
    easeOut: n => Math.sqrt(1 - Math.pow(n-1, 2)),
  });

  export const cbcirc = new EaseSet({
    easeIn: n => 1 - Math.cbrt(1 - Math.pow(n, 3)),
    easeOut: n => Math.cbrt(1 + Math.pow(n-1, 3)),
  })

  
  export const sine = new EaseSet({
    easeIn: n => 1 - Math.cos(n * Math.PI * 0.5),
    easeOut: n => Math.sin(n * Math.PI * 0.5),
  });
}