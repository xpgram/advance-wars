import { Game } from "../../..";
import { Slider } from "../../Common/Slider";

/** Extendable which covers 3-frame fade-in and fade-out for UI elements
 * because I got tired of writing it over and over again.
 */
export abstract class Fadable {

  transparency = new Slider({
    granularity: 1 / 3,
    track: 'min',
  });

  constructor() {
    Game.scene.ticker.add(this.updateTransparency, this);
  }

  destroy() {
    Game.scene.ticker.remove(this.updateTransparency, this);
  }

  protected updateTransparency() {
    this.transparency.increment();
  }

  show() {
    this.transparency.incrementFactor = 1;
  }

  hide() {
    this.transparency.incrementFactor = -1;
  }
}