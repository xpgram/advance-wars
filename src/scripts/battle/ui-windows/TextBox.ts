import { Color } from "../../color/Color";
import { Palette } from "../../color/ColorPalette";
import { BoxContainerProperties } from "../../Common/BoxContainerProperties";

/**
 * Consider renaming this class.
 * 
 * This is the information box used below the Field Menu to explain
 * what each option is for.
 */

const { HSV } = Color;

const palette = {
  background:     Palette.gale_force1,
  textBackground: Palette.encore,
  textRule:       Palette.gale_force2,
};

const TEXT_PROPS = new BoxContainerProperties({
  minWidth: 128,
  height: 12,
  padding: { top: 4 },
});

const BOX_PROPS = new BoxContainerProperties({
  margin: { left: 3, right: 3, top: 1, bottom: 1 },
  padding: { left: 3, right: 3, top: 2, bottom: 2 },
  children: [
    TEXT_PROPS,
    TEXT_PROPS,
  ],
});