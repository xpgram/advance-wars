import { Game } from "../..";
import { Point } from "../../scripts/Common/Point";
import { BurnAway } from "../../scripts/filters/BurnAway";
import { GlobalTimer } from "../../scripts/timer/GlobalTimer";
import { SceneTransition } from "./SceneTransition";


export class BurnTransition extends SceneTransition {

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

    const burnShader = new BurnAway(origin);
    this.lastScene.filters = [burnShader.filter];

    this.phaseOut
      .tween(2.0, burnShader.uniforms, {slider: 1});
  }

}