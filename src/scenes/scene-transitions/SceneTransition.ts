import { Game } from "../..";
import { PIXI } from "../../constants";
import { Point } from "../../scripts/Common/Point";
import { GlobalTimer } from "../../scripts/timer/GlobalTimer";
import { SceneTransitionEffect } from "./SceneTransitionEffect";


/**  */
export module SceneTransition {

  /** No transition effect. */
  export class None extends SceneTransitionEffect {
    phaseIn = new GlobalTimer();
    idleLoop = () => {};
    phaseOut = new GlobalTimer();

    build() {
      // none
    }
  }

  /** Fades to black, then fades back in. */
  export class BlackFade extends SceneTransitionEffect {
    phaseIn = new GlobalTimer();
    idleLoop = () => {};
    phaseOut = new GlobalTimer();
  
    build() {
      const { renderWidth: width, renderHeight: height } = Game.display;
  
      const g = new PIXI.Graphics();
      g.beginFill(0);
      g.drawRect(0,0, width,height);
      g.endFill();
  
      this.overlayer.addChild(g);
      this.overlayer.alpha = 0;
  
      const time = .15;
      this.phaseIn.tween(time, this.overlayer, {alpha: 1});
      this.phaseOut.tween(time, this.overlayer, {alpha: 0});
    }
  }

  /** NOT IMPLEMENTED */
  export class BurnAway extends SceneTransitionEffect {
    readonly destroyLastSceneDuringIdle = false;

    phaseIn = new GlobalTimer();
    idleLoop = () => {};
    phaseOut = new GlobalTimer();

    build() {
      const { random, trunc } = Math;
      const { renderWidth, renderHeight } = Game.display;

      const origin = new Point(
        trunc(random() * (renderWidth - 64) + 32),
        trunc(random() * (renderHeight - 64) + 32),
      )

      // const burnShader = new F_BurnAway(origin);
      // this.lastScene.filters = [burnShader.filter];

      // this.phaseOut
      //   .tween(2.0, burnShader.uniforms, {slider: 1});
    }
  }

};