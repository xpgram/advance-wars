import { Game } from "../..";
import { Timer } from "../../scripts/timer/Timer";
import { SceneTransition, SceneTransitionPhase } from "./SceneTransition";



export class BlackFadeTransition extends SceneTransition {

  private timerIn!: Timer;
  private timerOut!: Timer;

  build() {
    const { renderWidth: width, renderHeight: height } = Game.display;

    const g = new PIXI.Graphics();
    g.beginFill(0);
    g.drawRect(0,0, width,height);
    g.endFill();

    this.containers.overlayer.addChild(g);
    this.containers.overlayer.alpha = 0;

    this.timerIn
      .tween(.35, this.containers.overlayer, {alpha: 1})
      .wait()
      .do(this.idle, this);
    this.timerOut
      .tween(.35, this.containers.overlayer, {alpha: 0})
      .wait()
      .do(this.finish, this);
  }

  phaseIn: SceneTransitionPhase = {
    onStart: () => this.timerIn.start(),
  };

  phaseIdle: SceneTransitionPhase = {};

  phaseOut: SceneTransitionPhase = {
    onStart: () => this.timerOut.start(),
  };

}