import { Debug } from "./DebugUtils";

/**
 * Commonly useful functions.
 * @author Dei Valko
 * @version 0.1.2
 */
export const Common = {

  /** Returns a two-dimensional array filled with sleep. // TODO */
  Array2D<T>(rows: number, columns: number, fill: (() => T) | T): T[][] {
    let cb = (fill instanceof Function) ? fill : () => fill;
    return Array.from<any, T[]>(Array(rows), () => Array.from<any, T>(Array(columns), cb));
  },

  /** Confines n to the range [min, max] inclusive.
   * @deprecated clamp() is more descriptive. I think. */
  confine(n: number, min: number, max: number) {
    if (min > max) {
      let tmp = min;
      min = max;
      max = tmp;
    }
    if (n < min) n = min;
    else if (n > max) n = max;
    return n;
  },

  /** Contrains n to the range [min, max] inclusive. */
  clamp(n: number, min: number, max: number) {
    if (max < min)
      throw new Error(`min cannot be greater than max`);
    return Math.min(max, Math.max(min, n));
  },

  /** Returns true if n is in the range [min,max], default inclusive. */
  within(n: number, min: number, max: number, exclusive?: boolean) {
    if (exclusive)  // By default, undefined
      return (n > min && n < max);
    else
      return (n >= min && n <= max);
  },

  /** Returns true if n is in the range [min,max], default inclusive. */
  inRange(n: number, min: number, max: number, exclusive?: boolean) {
    return (exclusive)
      ? min < n && n < max
      : min <= n && n <= max;
  },

  /** Returns true if n is in the range [0,length), inclusive-exclusive. */
  validIndex(n: number, length: number) {
    return Common.inRange(n, 0, length-1);
  },

  /** Given a list of objects with a weight property, returns a copy of
   * that list sorted by that property in ascending order. */
   sortByWeight(li: {weight: number}[]) {
    return li.slice().sort( (a,b) => b.weight - a.weight );
  },

  /** Returns true if box1 and box2 overlap in any way. */
  boxCollision(box1: PIXI.Rectangle, box2: PIXI.Rectangle) {
    return (box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y);
  },

  /**
   * Retrieves bits from the object's information number. All JS numbers are 64-bit.
   * @param store The number to read from.
   * @param length The length of the bit-mask.
   * @param shift How far left the bit-mask is applied.
   * @return A number equivalent to the bits retrieved from the given store value.
   */
  readBits(store: number, length: number, shift: number) {
    let mask = Math.pow(2, length) - 1;  // Get us a series of 1 bits.
    return (store >> shift & mask);
  },

  /**
   * Writes bits to the object's information number. All JS numbers are 64-bit.
   * Returns the given store value as written to, as a new number.
   * @param store The number to write bits to.
   * @param value The value to write into info (overages are not possible; mask is applied to value, too).
   * @param length The length of the bit-mask.
   * @param shift How far left the bit-mask is applied.
   */
  writeBits(store: number, value: number, length: number, shift: number) {
    let mask = Math.pow(2, length) - 1;  // Get us a series of 1 bits.
    store = store & ~(mask << shift);
    store += (value & mask) << shift;
    return store;
  },

  /** Given a list of things, return a 'bouncing loop' of that list's contents, triangle-wave-style.
   * Ex: Given the list [1,2,3,4,5], return [1,2,3,4,5,4,3,2].
   */
  listToBouncingLoop(list: Array<any>) {
    let result = list.slice();
    for (let i = list.length - 2; i > 0; i--)
      result.push(list[i]);
    return result;
  },

  /** Given the frames.length of an animation and the desired time to completion (seconds), returns the fraction
   * of frames to play per global update (a Pixi.js thing) as a number.
   */
  animationSpeedFromTimeDuration(animLength: number, timeDuration: number) {
    return animLength / (60 * timeDuration);
    // TODO Get 60 fps from Pixi.ticker settings?
  },

  /** Returns the reciprocal of the elapsed frames desired per frame-change.
   * Providing this a value of 15 returns a number corresponding to one frame-change per 1/4th a second.
   */
  animationSpeedFromFrameInterval(interval: number) {
    return 1 / interval;
  },
}

/** Color value functions. */
export const Color = {

  /** Converts an HSV color set to HEX. Formula adapted from wikipedia. */
  HSV(hue: number, sat: number, val: number) {
    const errif = Debug.errif;
    const within = Common.within;
    const { ceil, abs } = Math;

    errif(!within(hue, 0, 360), `hue must be within 0 <= ${hue} <= 360`);
    errif(!within(sat, 0, 100), `sat must be within 0 <= ${sat} <= 100`);
    errif(!within(val, 0, 100), `val must be within 0 <= ${val} <= 100`);

    const c = (val / 100) * (sat / 100);            // chroma
    const x = c * (1 - abs(((hue / 60) % 2) - 1));  // linear function of chroma
    const m = (val / 100) - c;                      // value adjustment

    // which component set depends on which side of the rgb cube space we're using.
    const rgbset = [
      [0, x, c],
      [0, c, x],
      [x, c, 0],
      [c, x, 0],
      [c, 0, x],
      [x, 0, c]
    ][ceil(hue / 60) - 1];

    const component = (i: number) => 0xFF * (rgbset[i] + m) << (0x8 * i)
    return component(2) + component(1) + component(0); // r+g+b
  },

}