
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

import { PlayerFactionPalette } from "./PlayerFactionPalette";

export const palettes = {
  ui: {
    window: {
      background: 2,
      cursor: 2,
    }
  },
  factions: {
    red: <PlayerFactionPalette>{
      menu: {
        primary: 2,
      },
      insigniaSplash: [
        // This is supposed to be the palette swap info from red to ???
        // However, either I need to describe red here as well, which seems silly,
        // or I need to be *absolutely sure* that the order of these color
        // listings match those of ???'s.
        // Maybe I'll just call it insigniaSplashPaletteSwap and do the obvious thing.
      ],
    },
    blue: {

    },
    yellow: {

    },
    black: {

    },
  },
}