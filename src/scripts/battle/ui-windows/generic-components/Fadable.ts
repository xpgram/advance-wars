import { PIXI } from "../../../../constants";
import { Game } from "../../../..";
import { Slider } from "../../../Common/Slider";
import { UiWidget } from "./UiWidget";
import { ConstructorFor } from "../../../CommonTypes";

// NOTE
// This decorator is more a proof-of-concept; I think I'm going to leave the built-in fade effect
// in UiWidget alone. But this is how the decorators *would* work.


/** Decorator which enables an over-time transparency effect on show/hide state transitions. */
export function Fadable<BC extends ConstructorFor<UiWidget>>(Base: BC, frameDuration?: number) {
  
  const frames = frameDuration || 3;

  return class extends Base {
    
    protected transparency = new Slider({
      granularity: 1 / frames,
      track: 'min',
      incrementFactor: -1,
    });


    constructor(...args: any[]) {
      super(...args);
      Game.scene.ticker.add(this.updateTransparency, this);
    }

    destroy() {
      super.destroy?.call(this);
      Game.scene.ticker.remove(this.updateTransparency, this);
    }

    protected updateTransparency(): void {
      this.transparency.increment();
      this.container.alpha = this.transparency.output;
    }

    show() {
      // TODO Override behavior.
      // If Fadable overrides show(), but a different decorator depends on show(), what then?
      // UiWidget has show(), but I mean generally.
      // 
      // I'm looking for a way to add functionality to a class type without strongly conflicting
      // with any other added class types.
      // The super.chain can do this, but I would have to write
      // `functionName() { super.functionName?.call(this) }`
      // for every single one? I mean, that's fine, but... really?
      //
      // Also, this only produces fadable(uiwidgets).
      // It will *not* produce a fadable(slidable(uiwidget)), even if you write the instantiation that way.
      //
      // Hm.

      // super.show?.call(this);
      // super.updateListeners('on-show');
      this.transparency.incrementFactor = 1;
    }

    hide() {
      this.transparency.incrementFactor = -1;
    }

    skipAnimation(): void {
      super.skipAnimation?.call(this);
      this.transparency.setToExtreme();
      this.container.alpha = this.transparency.output;
    }
  }
}