import { PIXI } from "../constants";

/**
 * Commonly useful functions.
 * @author Dei Valko
 * @version 0.1.4
 */
export module Common {

  /** Returns a function which returns the given object with its inferred type intact, but with its
   * property members restricted to an extension of type T.
   * Useful for defining Record-types whose members also implement an interface.
   * 
   * Example:
   * ```
   * type Metadata = {name: string, power: number};
   * const Action = Common.confirmType<Metadata>() ({
   *   Attack: { name: "Attack", power: 5 },
   *   Wait:   { name: "Wait",   power: 0, delay: 12 },
   * });
   * Action.Wait.delay;   // OK
   * Action.Launch.name;  // `Property 'Launch' does not exist on type {...}`
   * ```
   **/
  export const confirmType = <T>() => <O extends Record<string, T>>(obj: O) => obj;

  /** Returns a function which returns the given object with its inferred type intact, but with its
   * property members restricted to an extension of type Req.
   * Useful for defining objects with inferred types which also implement an interface.
   * 
   * Example:
   * ```
   * type Algorithm = {name: string, update: (p: Point) => Point};
   * const LinearAlg = Common.implementsType<Algorithm>() ({
   *   name: "Linear",
   *   quantize(p: Point, n: number): Point { ... },
   *   update(p: Point): Point { ... },
   * });
   * LinearAlg.name;        // OK
   * LinearAlg.quantize();  // OK (even though not defined by <Algorithm>)
   * ```
   */
  export const implementsType = <Req>() => <T extends Req>(obj: T) => obj;

  /** Freezes the given object and returns it. */
  export function freezeObject<T>(obj: T): T {
    Object.freeze(obj);
    return obj;
  }

  /** Given a set of options and a set of defaults, returns an object  */
  export function assignDefaults<T extends {}, Y extends {}>(options: T, defaults: Y): T & Y {
    const res: Record<string, any> = {};
    const A = options as Record<string, any>;   // Literally just to make TypeScript shut up.
    const B = defaults as Record<string, any>;
    Object.keys({...options, ...defaults})
      .forEach( key => { res[key] = (A[key] !== undefined) ? A[key] : B[key] });
    return res as T & Y;
  }

  /** Given an object, completely dismantles its assigned properties.
   * This iterates over every property key, which may be a point of optimization.
   * This does not offer any depth dismantling; members are forgotten but otherwise intact. */
  export function destroyObject<T extends {}>(object: T): void {
    const obj = object as Record<string, any>;
    Object.keys(object).forEach( key => obj[key] = undefined);
  }

  /** Returns a two-dimensional array filled with a given value or via a point-field generator function.
   * Arrays are arranged in arr[x][y] fashion, or arr[col][row]. */
  export function Array2D<T>(columns: number, rows: number, fill: ((x: number, y: number) => T) | T): T[][] {
    const gen = (fill instanceof Function) ? fill : () => fill;
    return [...Array(columns)].map(
      (_, x) => [...Array(rows)].map(
        (_, y) => gen(x,y)
      )
    );
  }

  /** Given a list of things, returns a random thing. */
  export function choose<T>(list: T[]): T {
    const { random, floor } = Math;
    return list[ floor(random()*list.length) ];
  }

  /** Returns list if `cond` is ture, otherwise returns an empty list.  
   * Use with the spread operator like this:
   * ```
   * const events = [
   *   new Event('1'),
   *   ...insertIf(m > 0, new Event('2')),
   *   ...insertIf(m > 5, new Event('3')),
   * ]
   * ```
   */
  export function insertIf<T>(cond: boolean, ...elements: T[] ): T[] {
    return (cond) ? elements : [];
  }

  /** Confines n to the range [min, max] inclusive.
   * @deprecated clamp() is more descriptive. I think. */
  export function confine(n: number, min: number, max: number) {
    if (min > max) {
      let tmp = min;
      min = max;
      max = tmp;
    }
    if (n < min) n = min;
    else if (n > max) n = max;
    return n;
  }

  /** Contrains n to the range [min, max] inclusive. */
  export function clamp(n: number, min: number, max: number) {
    if (max < min)
      throw new Error(`min cannot be greater than max`);
    return Math.min(max, Math.max(min, n));
  }

  /** Contains `n` to the range [0, `lim`] by circularly projecting the
   * the space (-∞,∞) onto the range defined by `lim`. Useful for containing
   * degrees to the range [0,360], for instance. */
  export function rotate(n: number, lim: number) {
    n %= lim;
    return (n >= 0) ? n : n + lim;
  }

  /** Returns true if n is in the range [min,max], default inclusive. */
  export function within(n: number, min: number, max: number, exclusive?: boolean) {
    if (exclusive)  // By default, undefined
      return (n > min && n < max);
    else
      return (n >= min && n <= max);
  }

  /** Returns true if n is in the range [min,max], default inclusive. */
  export function inRange(n: number, min: number, max: number, exclusive?: boolean) {
    return (exclusive)
      ? min < n && n < max
      : min <= n && n <= max;
  }

  /** Returns true if n is in the range [0,length), inclusive-exclusive. */
  export function validIndex(n: number, length: number) {
    return Common.inRange(n, 0, length-1);
  }

  /** Returns -1 if n is less than min, 1 if more than max, and 0 if between.
   * The range [min, max] is inclusive. */
  export function rangeDisplacementSide(n: number, min: number, max: number): number {
    return -1*Number(n < min) + Number(n > max);
  }

  /** Returns the relative distance n is from the inclusive range [min, max].
   * Returned number's range is [-distance, 0, +distance] */
  export function displacementFromRange(n: number, min: number, max: number): number {
    return (n - min)*Number(n < min) +
           (n - max)*Number(n > max);
  }

  /** Given a list of objects with a weight property, returns a copy of
   * that list sorted by that property in ascending order. */
  export function sortByWeight(li: {weight: number}[]) {
    return li.slice().sort( (a,b) => a.weight - b.weight );
  }

  /** Returns true if box1 and box2 overlap in any way. */
  export function boxCollision(box1: PIXI.Rectangle, box2: PIXI.Rectangle) {
    return (box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y);
  }

  /**
   * Retrieves bits from the object's information number. All JS numbers are 64-bit.
   * @param store The number to read from.
   * @param length The length of the bit-mask.
   * @param shift How far left the bit-mask is applied.
   * @return A number equivalent to the bits retrieved from the given store value.
   * @deprecated Use BitIO
   */
  export function readBits(store: number, length: number, shift: number) {
    let mask = Math.pow(2, length) - 1;  // Get us a series of 1 bits.
    return (store >> shift & mask);
  }

  /**
   * Writes bits to the object's information number. All JS numbers are 64-bit.
   * Returns the given store value as written to, as a new number.
   * @param store The number to write bits to.
   * @param value The value to write into info (overages are not possible; mask is applied to value, too).
   * @param length The length of the bit-mask.
   * @param shift How far left the bit-mask is applied.
   * @deprecated Use BitIO
   */
  export function writeBits(store: number, value: number, length: number, shift: number) {
    let mask = Math.pow(2, length) - 1;  // Get us a series of 1 bits.
    store = store & ~(mask << shift);
    store += (value & mask) << shift;
    return store;
  }

  /** Given a list of things, return a 'bouncing loop' of that list's contents, triangle-wave-style.
   * Ex: Given the list [1,2,3,4,5], return [1,2,3,4,5,4,3,2].
   */
  export function listToBouncingLoop(list: Array<any>) {
    let result = list.slice();
    for (let i = list.length - 2; i > 0; i--)
      result.push(list[i]);
    return result;
  }

  /** Given the frames.length of an animation and the desired time to completion (seconds), returns the fraction
   * of frames to play per global update (a Pixi.js thing) as a number.
   */
  export function animationSpeedFromTimeDuration(animLength: number, timeDuration: number) {
    return animLength / (60 * timeDuration);
    // TODO Get 60 fps from Pixi.ticker settings?
  }

  /** Given the frames.length of an animation and the speed at which it plays (frames per frame), returns the
   * time-length of the animation in seconds. */
  export function animationTimeDuration(animLength: number, animationSpeed: number) {
    return animLength / (60 * animationSpeed);
  }

  /** Returns the reciprocal of the elapsed frames desired per frame-change.
   * Providing this a value of 15 returns a number corresponding to one frame-change per 1/4th a second.
   */
  export function animationSpeedFromFrameInterval(interval: number) {
    return 1 / interval;
  }

  /** Returns the first found repeating sequence within the list li.
   * A sequence must repeat 3 times for it to be returned. */
  export function repeatingSequence<T>(li: T[], maxSequence: number): T[] {
    function get(idx: number): T | undefined {
      if (Common.validIndex(idx, li.length))
        return li[idx];
    }

    for (let lim = 2; lim <= maxSequence; lim++) {
      let result: T[] = [];
      let found = true;

      for (let i = 0; i < lim; i++) {
        if (!Common.validIndex(i, li.length))
          break;

        const double = li[i] === get(i + lim*2);
        const triple = li[i] === get(i + lim*3);

        if (double && triple)
          result.push(li[i]);
        else {
          found = false;
          break;
        }
      }

      if (found)
        return result;
    }
    // Null case
    return [];
  }

}
