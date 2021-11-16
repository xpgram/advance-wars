import { Game } from "../../..";
import { Slider } from "../../Common/Slider";

/** Extendable which covers 3-frame fade-in and fade-out for UI elements
 * because I got tired of writing it over and over again.
 */
export abstract class Fadable {

  abstract container: PIXI.Container;

  transparency = new Slider({
    granularity: 1 / 3,
    track: 'min',
    incrementFactor: -1,
  });

  constructor() {
    Game.scene.ticker.add(this.updateTransparency, this);
  }

  destroy() {
    Game.scene.ticker.remove(this.updateTransparency, this);
  }

  protected updateTransparency() {
    this.transparency.increment();
    this.container.alpha = this.transparency.output;
  }

  show() {
    this.transparency.incrementFactor = 1;
  }

  hide() {
    this.transparency.incrementFactor = -1;
  }
}