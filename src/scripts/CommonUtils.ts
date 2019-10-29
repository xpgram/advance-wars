/**
 * Commonly useful functions.
 * 
 * @author Dei Valko
 * @version 0.1.0
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
    }        
}