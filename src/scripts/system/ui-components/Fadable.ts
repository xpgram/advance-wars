import { Type } from "../../CommonTypes";
import { Timer } from "../../timer/Timer";
import { UiComponent } from "./UiComponent";


/** A decorator which modifies a UiComponent class to have alpha fade-in/out transitional
 * behavior on show/hide events. */
export function Fadable<T extends Type<UiComponent>>(type: T, transitionTime: number = .33) {
  return class Fadable extends type {

    protected timer?: Timer;
    protected readonly animTime = transitionTime;

    // TODO Guarantee container.visible == true?

    destroy() {
      super.destroy();
      this.timer?.destroy();
    }

    show() {
      this.timer?.destroy();
      this.timer = Timer.tween(this.animTime, this.container, {alpha: 1});
      return this;
    }

    hide() {
      this.timer?.destroy();
      this.timer = Timer.tween(this.animTime, this.container, {alpha: 0});
      return this;
    }

    skipAnimation() {
      this.timer?.skip();
      return this;
    }
  }
}