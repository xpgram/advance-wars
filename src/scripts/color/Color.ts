import { Common } from "../CommonUtils";
import { Debug } from "../DebugUtils";
import { HexColor, HSVColor, RGBColor } from "./ColorTypes";


/** Manipulates, primarily, hex colors. */
export module Color {

  /** Converts an HSV color set to Hex format. Formula adapted from Wikipedia. */
  export function HSV(hue: number, sat: number, val: number): HexColor {
    const { errif } = Debug;
    const { within } = Common;
    const { ceil, abs } = Math;

    const errcheck = (v: number, lim: number, label: string) => {
      errif(!within(v, 0, lim), `${label} must be within 0--${lim}: given ${v}`);
    }

    errcheck(hue, 360, 'hue');
    errcheck(sat, 100, 'sat');
    errcheck(val, 100, 'val');

    const c = (val / 100) * (sat / 100);            // chroma
    const x = c * (1 - abs(((hue / 60) % 2) - 1));  // linear function of chroma
    const m = (val / 100) - c;                      // value adjustment

    // which component set depends on which side of the rgb cube space we're using.
    const cubeSide = (hue === 0) ? 0 : ceil(hue / 60) - 1;
    const rgbset = [
      [0, x, c],
      [0, c, x],
      [x, c, 0],
      [c, x, 0],
      [c, 0, x],
      [x, 0, c],
    ][cubeSide];

    const component = (i: number) => 0xFF * (rgbset[i] + m) << (i*8)
    return component(2) + component(1) + component(0); // r+g+b
  }

  /** Converts an RGB color set to Hex format. */
  export function RGB(r: number, g: number, b: number): HexColor {
    const { errif } = Debug;
    const { within } = Common;
    const { floor } = Math;

    const errcheck = (v: number, label: string) => {
      errif(!within(v, 0, 255), `${label} must be within 0--255: given ${v}`);
      errif(v - floor(v) !== v, `${label} must be an integer: given ${v}`);
    }

    errcheck(r, 'red');
    errcheck(g, 'green');
    errcheck(b, 'blue');

    return (r << 16) + (g << 8) + b;
  }

  /** Returns true if the given number is within the hex-format color space. */
  export function isHex(c: number): c is HexColor {
    return Common.within(c, 0, 0xFFFFFF);
  }

  /** Returns an RGB color object extracted from a hex-format color. */
  function fromHex(c: HexColor): RGBColor {
    const component = (i: number) => (c & (0xFF << i*8)) >> i*8;
    return {
      r: component(2),
      g: component(1),
      b: component(0),
    }
  }

  /** ..? Allows simple proportional adjustments. Implementation is naive, however.
   * I think the point is to adjust luminance/brightness, I should find the formula
   * for that.
   * @deprecated use luminance(hexcolor, value) whenever it's written. */
  export function multiply(c: HexColor, n: number): HexColor {
    const { clamp } = Common;
    const { trunc } = Math;

    const color = fromHex(c) as RGBColor & Record<string, number>;

    const adjust = (m: number) => clamp(trunc(n*m), 0, 0xFF);
    for (const key in color)
      color[key] = adjust(color[key]);

    return RGB(color.r, color.g, color.b);
  }

}
