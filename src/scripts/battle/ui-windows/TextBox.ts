import { BoxContainerProperties } from "../../Common/BoxContainerProperties";
import { Color } from "../../CommonUtils"

/**
 * Consider renaming this class.
 * 
 * This is the information box used below the Field Menu to explain
 * what each option is for.
 */

const HSV = Color.HSV;

const palette = {
  background:     HSV(196, 28, 23),
  textBackground: HSV(220, 16, 50),
  textRule:       HSV(214, 18, 35),
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