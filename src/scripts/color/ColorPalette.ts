import { Common } from "../CommonUtils";
import { Color } from "./Color";

const { HSV } = Color;

export const Palette = Common.freezeObject({
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

  gale_force1:        HSV(200, 30, 30), // Cmd Menu Background
  gale_force2:        HSV(215, 25, 35), // Cmd Menu Primary
  cloudless:          HSV(220, 15,100), //  + Light accent

  caribbean_green:    HSV(166,100, 80), // Menu Cursor
  terrestrial:        HSV(170, 65, 40), // Cmd Menu Selected
  blister_pearl:      HSV(170, 35,100), //  + Light accent

  blueprint:          HSV(200, 54, 48), // Map Cursor Dark

  // Neutral Faction
  standing_ovation:   HSV(300,  5, 75), // CO Window
  asian_violet:       HSV(300,  6, 54), // Emblem Tint

  // Red Faction
  boerewors:          HSV(350, 67, 58), // CO Window
  hibiscus_petal:     HSV(  0, 29, 93), // Emblem Tint    Is this derivable from boerewors?

  // Blue Faction
  blue_sail:          HSV(223, 74, 61), // CO Window
  maximum_blue_purple:HSV(240, 29, 93), // Emblem Tint

  // Yellow Faction
  brassy_brass:       HSV( 48, 71, 45), // CO Window
  master_key:         HSV( 48, 38, 87), // Emblem Tint

  // Green Faction

  // Black Faction
  violet_black:       HSV(300, 11, 29), // CO Window
  // cerebral grey1
})
