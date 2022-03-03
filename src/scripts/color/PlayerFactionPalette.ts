import { Faction } from "../battle/EnumTypes";
import { Common } from "../CommonUtils";
import { Palette } from "./ColorPalette";
import { HexColor } from "./ColorTypes";


/** A container consolidating player faction palette data. */
export type FactionPalette = {
  CoWindow: {
    background: HexColor,
    white_tintdown: HexColor,
  }
  propertyCapture: {
    meter: HexColor,
    tint: HexColor,
  }
  turnStartSplash: {
    presenceBackground: HexColor,
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


const neutral: FactionPalette = {
  CoWindow: {
    background: Palette.standing_ovation,
    white_tintdown: Palette.asian_violet,
  },
  propertyCapture: {
    meter: Palette.standing_ovation,
    tint: Palette.asian_violet,
  },
  turnStartSplash: {
    presenceBackground: Palette.standing_ovation,
  },
  paletteSwap: {},
}

const red: FactionPalette = {
  CoWindow: {
    background: Palette.boerewors,
    white_tintdown: Palette.hibiscus_petal,
  },
  propertyCapture: {
    meter: Palette.boerewors,
    tint: Palette.hibiscus_petal,
  },
  turnStartSplash: {
    presenceBackground: Palette.boerewors,
  },
  paletteSwap: {},
}

const blue: FactionPalette = {
  CoWindow: {
    background: Palette.blue_sail,
    white_tintdown: Palette.maximum_blue_purple,
  },
  propertyCapture: {
    meter: Palette.blue_sail,
    tint: Palette.maximum_blue_purple,
  },
  turnStartSplash: {
    presenceBackground: Palette.blue_sail,
  },
  paletteSwap: {},
}

const yellow: FactionPalette = {
  CoWindow: {
    background: Palette.brassy_brass,
    white_tintdown: Palette.master_key,
  },
  propertyCapture: {
    meter: Palette.brassy_brass,
    tint: Palette.master_key,
  },
  turnStartSplash: {
    presenceBackground: Palette.brassy_brass,
  },
  paletteSwap: {},
}

const green: FactionPalette = {
  CoWindow: {
    background: 0,
    white_tintdown: 0,
  },
  propertyCapture: {
    meter: 0,
    tint: 0
  },
  turnStartSplash: {
    presenceBackground: 0,
  },
  paletteSwap: {},
}

const black: FactionPalette = {
  CoWindow: {
    background: Palette.violet_black,
    white_tintdown: Palette.cerebral_grey1,
  },
  propertyCapture: {
    meter: Palette.violet_black,
    tint: Palette.cerebral_grey1,
  },
  turnStartSplash: {
    presenceBackground: Palette.violet_black,
  },
  paletteSwap: {},
}

/** A container for all palette information for all Advance Wars factions. */
export const FactionPalettes = Common.freezeObject({ neutral, red, blue, yellow, green, black });

/** Returns a FactionPalette corresponding to the given Faction value. */
export function getFactionPalette(faction: Faction) {
  return [neutral, neutral, red, blue, yellow, black][faction];
}
