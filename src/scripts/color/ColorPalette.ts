import { Color } from "./Color";

const { HSV } = Color;

// TODO Here I define key colors in the common palette.
//      More specific values can be defined where they're relevant.

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

  caribbean_green:    HSV(166,100, 80),   // Menu Cursor
  terrestrial:        HSV(170, 65, 40),   // Cmd Menu Selected
  blister_pearl:      HSV(170, 35,100),   //  + Light accent

  // Map Cursor Light   (probs just white)
  // Map Cursor Dark    (menu bg?)

  // Faction CO Windows
  // Faction Capture Meters
  // Faction Capture Illustration Tints
}
