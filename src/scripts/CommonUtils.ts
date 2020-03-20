
/**
 * Commonly useful functions.
 * @author Dei Valko
 * @version 0.1.2
 */
export const Common = {

    /** Confines n to the range [min, max] inclusive. */
    confine: (n: number, min: number, max: number) => {
        if (min > max) {
            let tmp = min;
            min = max;
            max = tmp;
        }
        if (n < min) n = min;
        else if (n > max) n = max;
        return n;
    },

    /** Returns true if n is in the range [min,max], default inclusive. */
    within: (n: number, min: number, max: number, exclusive?: boolean) => {
        if (exclusive)  // By default, undefined
            return (n > min && n < max);
        else
            return (n >= min && n <= max);
    },

    /** Returns true if n is in the range [0,length), inclusive-exclusive. */
    validIndex: (n: number, length: number) => {
        return Common.within(n, 0, length-1);
    },

    /** Returns true if box1 and box2 overlap in any way. */
    boxCollision: (box1: PIXI.Rectangle, box2: PIXI.Rectangle) => {
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
    readBits: (store: number, length: number, shift: number) => {
        let mask = Math.pow(2,length) - 1;  // Get us a series of 1 bits.
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
    writeBits: (store: number, value: number, length: number, shift: number) => {
        let mask = Math.pow(2,length) - 1;  // Get us a series of 1 bits.
        store = store & ~(mask << shift);
        store += (value & mask) << shift;
        return store;
    },

    /** Given a list of things, return a 'bouncing loop' of that list's contents, triangle-wave-style.
     * Ex: Given the list [1,2,3,4,5], return [1,2,3,4,5,4,3,2].
     */
    listToBouncingLoop: (list: Array<any>) => {
        let result = [];
        for (let i = 0; i < list.length; i++)
            result.push(list[i]);
        for (let i = list.length-2; i > 0; i--)
            result.push(list[i]);
        return result;
    },

    /** Given the frames.length of an animation and the desired time to completion (seconds), returns the fraction
     * of frames to play per global update (a Pixi.js thing) as a number.
     */
    animationSpeedFromTimeDuration: (animLength: number, timeDuration: number) => {
        return animLength / (60 * timeDuration);
        // TODO Get 60 fps from Pixi.ticker settings?
    },

    /** Returns the reciprocal of the elapsed frames desired per frame-change.
     * Providing this a value of 15 returns a number corresponding to one frame-change per 1/4th a second.
     */
    animationSpeedFromFrameInterval: (interval: number) => {
        return 1 / interval;
    }
}