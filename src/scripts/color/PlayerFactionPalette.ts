import { HexColor } from "./ColorTypes";

/**  */
export type FactionPalette = {
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

export const FactionPalettes = {
  red: <FactionPalette>{

  },
  blue: <FactionPalette>{

  },
  yellow: <FactionPalette>{

  },
  green: <FactionPalette>{

  },
  black: <FactionPalette>{

  },
}

// TODO Palette swaps... I might keep them where they're relevant. I don't know.
//   It'd be nice, I guess, if I could describe them on the spritesheet their image is a member of,
//   but I don't know what to do about that yet. I guess I could mod Pixi myself to look for a palette
//   field and save a new texture via a PixiFilter or something. Prolly not gonna.
//   
//   What I should probably do is extract the palette-swap-texture process to a function. You could
//   give it the texture and a list of colors pairs and it would return a new texure.
//   Then, those color pairs... you know what I should do?
//
//   Every image has a name and a sheet. The names are arranged like a folder structure.
//   Every resource name paired with its spritesheet root should refer to a list of faction color via
//   a service kind of like RegionMap: defined terms are returned when asked, otherwise an empty list
//   and a console warning accompany and undefined request.
//
//   This would require a little maintaince on my end, I don't think I can make it automatic,
//   but this would intrinsically pair resources with their palette variations and it would be
//   easily accessible.
//     getPaletteSwap.blue('UISpritesheet', 'emblems/13th-battalion.png')
//   
//   This (won't, but) could easily get very large and unwieldy.
//   I think I would need an indexing service which allows me to add and remove them with a
//   few copy-pastes.
//
// TODO Alternatively, I could find that they're combinable and I could keep
//   one really large one for each faction here.
