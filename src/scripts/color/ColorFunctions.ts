import { Common } from "../CommonUtils";
import { Color, HexColor } from "./ColorTypes";

export module ColorFunctions {

  export function fromHex(c: HexColor): Color {
    return {
      r: (c & 0xFF0000) >> 16,
      g: (c & 0xFF00) >> 8,
      b: (c & 0xFF),
    }
  }

  export function toHex(c: Color): HexColor {
    return (c.r << 16) + (c.g << 8) + c.b;
  }

  export function multiply(c: HexColor, n: number): HexColor {
    const color = fromHex(c) as Color & Record<string, number>;

    const adjust = (m: number) => Common.clamp(n*m, 0, 0xFF);
    for (const key in color)
      color[key] = adjust(color[key]);

    return toHex(color);
  }

}