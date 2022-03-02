
// TODO This is way too specific.
// Accessing the color for a popup window via
// palettes.ui.window.background *inside* that popup window seems a little odd.
//
// Like, CommandMenu *should* be responsible for its own appearance, right?
// On some level.
// So why is it defined here?
// Because it might be reused.
// Reused by what, and for what purpose?
// I need language that answers *this* question; palettes.ui.window.background
// fails to meaningfully address the palette problem, it just moves the same
// structure in CmdMenu to here, and it ends up all the more confusing for it.
//
// I'll need to do some thinking.
// A little CSS influence might not hurt.

import { Color } from "../CommonUtils";
import { PlayerFactionPalette } from "./PlayerFactionPalette";

export const test = {
  // Describe shades.
  primary1: 1,
  primary2: 2,

  // Describe bases.
  primary: 1,
  secondary: 2,
  tertiary: 3,
  quaternary: 4,
  quinary: 5,
  senary: 6,
  septenary: 7,
  octonary: 8,
  nonary: 9,
  denary: 10,
  undenary: 11,
  duodenary: 12,

  // There's no fucking way you have 12 important hues in your color scheme.
}
const t = {
  // Also... depending on the purpose.
  // Maybe do this?

  // These are more functional descriptors.
  primary: 1,
  secondary: 2,
  accent: 3,

  accept: 10, // this.primary,
  reject: 20,
  caution: 30,

  // It might make sense to describe the color set first, and then describe
  // the functional aspect as a super-layer over the color set.
  // Especially since... I mean, these look like they'd only really be useful
  // to dialogs and widgets. CommandMenu doesn't have an 'accept' button,
  // nor does the 'info-details' slide-in window.

  // It was described by someone that using color names for color points,
  // like 'color-orange' means #F060D6 makes it *a lot* easier to maintain
  // a consistent color scheme while giving the designer intuitive access
  // to the palette.
  // 
  // Like, if you want something orange, well, go for it. But also,
  // it's always the same orange across the project.
  //
  // The only problem I have with this approach is with scheme changes.
  // If I want to change 'orange' to 'turquoise' I then have to redefine
  // the word orange to be #60D6F0, which is not orange, and henceforth I
  // no longer know what the fuck 'orange' even refers to in the scheme.
  //
  // But, if I use the color-bases approach (primary, secondary, etc), I lose
  // that designer intuition amid the source and I have to keep the palette
  // open somewhere for reference.
  //
  // The main problem I see is that there is nothing background-y or accent-y
  // about 'secondary' and 'tertiary'. I mean, which should be which? These
  // words only describe a level of importance.
  //
  // So, I think I want a mixture.
  // Primary and Secondary are relevant to main content. Whatever that means.
  // But they're both 'primary' in their own sense.
  // 'Accent' and... other words, are relative to those bases.
  // One might have a primary and secondary accent separate from one another.
  //
  // I could also consider that this app is not likely to feature user-scheme-
  // settings even if I later change the colors myself in the source.

  // I like the direct color names for now, I suppose.
  // It's simple, elegant, intuitive.
  // I'll think about primaries and such later.
  // Possibly not relevant to this project.
}

const { HSV } = Color;

// TODO I need to consolodate. Color goes into its own ecosystem space,
// this probably follows it.

export const palette = {                  // v Until I setup the color overlayer v
  white:              HSV(  0,  0,100),
  black:              HSV(  0,  0,  0),

  carbon1:            HSV(  0,  0, 10),
  carbon2:            HSV(  0,  0, 20),
  carbon3:            HSV(  0,  0, 30),
  grey1:              HSV(  0,  0, 40),
  grey2:              HSV(  0,  0, 50),
  grey3:              HSV(  0,  0, 60),
  cerebral_grey1:     HSV(  0,  0, 70),
  cerebral_grey2:     HSV(  0,  0, 80),
  cerebral_grey3:     HSV(  0,  0, 90),

  gale_force1:        HSV(200, 30, 30),   // Cmd Menu Background
  gale_force2:        HSV(215, 25, 35),   // Cmd Menu Primary
  cloudless:          HSV(220, 15,100),   //  + Light accent

  caribbean_green:    HSV(166,100, 80),   // Cursor
  terrestrial:        HSV(170, 65, 40),   // Cmd Menu Selected
  blister_pearl:      HSV(170, 35,100),   //  + Light accent
}

// TODO This should go into its own file.
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
export const playerFactions = {
  red: <PlayerFactionPalette>{

  },
  blue: <PlayerFactionPalette>{

  },
  yellow: <PlayerFactionPalette>{

  },
  green: <PlayerFactionPalette>{

  },
  black: <PlayerFactionPalette>{

  },
}