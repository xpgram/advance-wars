import { PIXI } from "../../../../constants";
import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { Slider } from "../../../Common/Slider";

export type WidgetSettings = {
  position: Point,
  origin?: Point,
}

const DefaultWidgetSettings = {
  origin: new Point(),
}

/** Essentially, a PIXI.Container with constructor settings.
 * This is the base class all UI widgets descend from. Further behaviors and styles are
 * added via decorators applied to objects of this class.
*/
export abstract class UiWidget {

  readonly container = new PIXI.Container();

  readonly position: Point;
  readonly origin: Point;

  protected transparency = new Slider({
    granularity: 1/3,
    track: 'min',
    incrementFactor: -1,
  });


  constructor(options: WidgetSettings) {
    options = {...DefaultWidgetSettings, ...options};
    const { position, origin } = options;

    this.position = position as Point;
    this.origin = origin as Point;
    this.repositionWidget();

    this.container.on('childAdded', this.repositionWidget, this);
    this.container.on('removedFrom', this.repositionWidget, this);

    Game.scene.ticker.add(this.updateTransparency, this);
  }

  destroy() {
    this.container.destroy({children: true});
    Game.scene.ticker.remove(this.updateTransparency, this);
  }

  /** Callback to maintain position from element origin on dimension changes. */
  protected repositionWidget() {
    const { width, height } = this.container;
    const { position, origin } = this;
    this.container.position.set(
      position.x - width*origin.x,
      position.y - height*origin.y,
    );
  }

  /** Update step which gradually changes element transparency. */
  protected updateTransparency() {
    this.transparency.increment();
    this.container.alpha = this.transparency.output;
  }

  /** Set this element to visible. */
  show() {
    this.transparency.incrementFactor = 1;
  }

  /** Set this element to invisible. */
  hide() {
    this.transparency.incrementFactor = -1;
  }

  /** Skips incremental animation changes, setting the widget to whatever its ideal state is.
   * Overridable, but call super.skipAnimation() to capture all procedures. */
  skipAnimation() {
    this.transparency.setToExtreme();
  }

}