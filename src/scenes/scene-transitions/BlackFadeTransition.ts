import { Game } from "../..";
import { Timer } from "../../scripts/timer/Timer";
import { SceneTransition } from "./SceneTransition";



export class BlackFadeTransition extends SceneTransition {

  phaseIn = new Timer();
  idleLoop = () => {};
  phaseOut = new Timer();

  build() {
    const { renderWidth: width, renderHeight: height } = Game.display;

    const g = new PIXI.Graphics();
    g.beginFill(0);
    g.drawRect(0,0, width,height);
    g.endFill();

    this.overlayer.addChild(g);
    this.overlayer.alpha = 0;

    this.phaseIn.tween(.35, this.overlayer, {alpha: 1});
    this.phaseOut.tween(.35, this.overlayer, {alpha: 0});
  }

}