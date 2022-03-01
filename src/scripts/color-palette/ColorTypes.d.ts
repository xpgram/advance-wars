
/** An object which represents a point in the RGB color space.
 * Generally used for HexColor manipulation; HexColor is otherwise the
 * preferred mode of color expression. */
export type Color = {
  r: number,
  g: number,
  b: number,
}

/** Represents a point in the RGB color space. Always of the form 0xFFFFFF. */
export type HexColor = number;