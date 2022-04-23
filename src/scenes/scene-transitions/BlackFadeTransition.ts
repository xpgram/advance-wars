import { Game } from "../..";
import { GlobalTimer } from "../../scripts/timer/GlobalTimer";
import { SceneTransition } from "./SceneTransition";


export class BlackFadeTransition extends SceneTransition {

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

    const time = .075;
    this.phaseIn.tween(time, this.overlayer, {alpha: 1});
    this.phaseOut.tween(time, this.overlayer, {alpha: 0});
  }

}