import { Debug } from "../DebugUtils";

const MAX_BITWIDTH = 32;
let LAST_BIT_SHIFT = 0;

/** Describes a bit-set position and length within a 32-bit number. */
export type BitMask = {
  shift: number,
  width: number,
}

/** Protection against overflowing Javascript's maximum number size. */
function assertBitDepth(mask: BitMask) {
  Debug.assert(mask.shift + mask.width < MAX_BITWIDTH,
    `BitIO cannot make use of more than ${MAX_BITWIDTH} bits of information.`);
}

/** Common bitshift read/write methods. */
export module BitIO {

  /** Generates and returns a new BitMask of the given width relative to
   * the last one generated. Use from=0 to reset the counter on call. */
  export function Generate(width: number, from?: number) {
    LAST_BIT_SHIFT = (from !== undefined) ? from : LAST_BIT_SHIFT;
    const bitmask = {
      shift: LAST_BIT_SHIFT,
      width,
    }
    LAST_BIT_SHIFT += width;
    assertBitDepth(bitmask);
    return bitmask;
  }

  /** Read a number from the store number at the position described by BitMask. */
  export function ReadBits(store: number, bitmask: BitMask) {
    assertBitDepth(bitmask);
    const { shift, width } = bitmask;
    const mask = Math.pow(2, width) - 1;
    return (store >> shift & mask);
  }

  /** Writes bits to the store number at the position described by BitMask.
   * The width described by BitMask is considered an n-bit number; overflow
   * is not possible. Bits which do not fit are simply lost. */
  export function WriteBits(store: number, value: number, bitmask: BitMask) {
    assertBitDepth(bitmask);
    const { shift, width } = bitmask;
    const mask = Math.pow(2, width) - 1;
    store = store & ~(mask << shift);   // Erase current value
    store += (value & mask) << shift;   // Write new value
    return store;
  }

  /** Reads the given value of store at BitMask and returns it as a boolean.
   * Uses falsey rules, so greater than zero is true and any other value is false. */
  export function GetBoolean(store: number, bitmask: BitMask): boolean {
    return 0 < BitIO.ReadBits(store, bitmask);
  }

}
