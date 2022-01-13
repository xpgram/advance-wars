import { Point } from "../../../Common/Point";
import { Slider } from "../../../Common/Slider";
import { Button } from "../../../controls/Button";
import { TranslationFunctions } from "./TranslationFunctions";
import { ViewSide } from "./UiEnums";
import { UiWidget } from "./UiWidget";

type DrawerWidgetOptions {
  position: Point,
  origin?: Point,
  button: Button,
}

/**  */
export abstract class DrawerWidget extends UiWidget {

  /** The button this drawer listens to to determine extended state. */
  private button: Button;

  /** Which side this drawer sliders in from. */
  side = ViewSide.Left;

  /** Whether this drawer is in the extended (pulled out) state irrespective of
   * animation state. */
  get extended() { return this._extended; }
  private _extended = false;

  /**  */
  private positionSlider = new Slider({
    granularity: 1/7,
    shape: TranslationFunctions.easeIn,
  });

  
}