import { HexColor } from "./ColorTypes";

/**  */
export type PlayerFactionPalette = {
  CoWindow: {
    background: HexColor,
  }
  propertyCapture: {
    meter: HexColor,
    tint: HexColor,
  }
  turnStartSplash: {
    // TODO I think I just use swap pairs, here.
    // This might be irrelevant.
  }
  paletteSwap: {
    // TODO ?
    // This would be from red.
    // This would be useful if I can consolidate the different color-
    // pair-sets I have for different images into one mega pair-set.
    // If I can confirm there are no duplicate answers, or that they
    // are minimal and segregatable into purposes (like troops, ui, etc.),
    // then this is a good place to keep that data.
  }
}
