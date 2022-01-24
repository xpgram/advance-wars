import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { Slider } from "../../../Common/Slider";
import { Button } from "../../../controls/Button";
import { TranslationFunctions } from "./TranslationFunctions";
import { ViewSide } from "./UiEnums";
import { UiWidget } from "./UiWidget";

type DrawerWidgetOptions = {
  position: Point,
  origin?: Point,
  slideDistance?: number,
  button: Button,
}

/** 
 * Defines a UiWidget which is normally hidden but does a pull-out animation
 * revealing itself on screen when given certain triggers.
 * 
 * Setting the position sets the 'home' position, which is also the fully extended,
 * revealed position. When this widget is hidden (the 'drawer' is closed) the widget
 * is displaced from its 'home' position by a distance proportional to slideDistance
 * (if set) or its own width. The exact proportion is determined by the incremental
 * slider that defines its pull-out animation.
 * 
 * @author Dei Valko
 */
export abstract class DrawerWidget extends UiWidget {

  /** The button this drawer listens to to determine extended state. */
  private button: Button;

  /** Whether to listen to controls. */
  disabled = false;

  /** Which side this drawer sliders in from. */
  side = ViewSide.Left;

  /** Whether to show the drawer widget irrespective of any other controls. */
  forceReveal = false;

  /** How far this widget slides out from it's set position. */
  slideDistance?: number;

  /** Whether this drawer is in an extended (sticking out) state. */
  get extended() { return !this.positionSlider.equalsMin(); }

  /** Whether this drawer is in the fully extended (pulled out) state, as far as it'll go. */
  get fullyExtended() { return this.positionSlider.equalsMax(); }

  /**  */
  private positionSlider = new Slider({
    granularity: 1/7,
    incrementFactor: -1,
    shape: TranslationFunctions.easeIn,
  });

  
  constructor(options: DrawerWidgetOptions) {
    super(options);
    this.button = options.button;
    this.slideDistance = options.slideDistance;
    Game.scene.ticker.add(this.updateDrawerSlide, this);
  }

  destroy() {
    super.destroy();
    Game.scene.ticker.remove(this.updateDrawerSlide, this);
  }

  /** Update step which gradually changes element displacement from its 'home' position. */
  updateDrawerSlide() {
    const { disabled, forceReveal } = this;
    const triggeredByButton = (this.button.down);
    
    const inc = (!disabled && triggeredByButton || forceReveal) ? 1 : -1;
    this.positionSlider.incrementFactor = inc;
    this.positionSlider.increment();
    this.repositionWidget();
  }

  protected repositionWidget() {
    super.repositionWidget();
    const maxSlide = this.slideDistance || this.container.width;
    const slide = maxSlide * this.positionSlider.output;
    this.container.x += slide * this.side;
  }

  skipAnimation() {
    super.skipAnimation();
    this.positionSlider.setToExtreme();
  }
}