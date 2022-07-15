import { PIXI } from "../../../../constants";
import { Game } from "../../../..";
import { Ease } from "../../../Common/EaseMethod";
import { Timer } from "../../../timer/Timer";
import { fonts } from "../../ui-windows/DisplayInfo";
import { TurnState } from "../TurnState";
import { GameEnd } from "./GameEnd";

// TODO Extend this from GameWin to reduce redundancy

export class GameLose extends TurnState {
  get type() { return GameLose; }
  get name() { return 'GameLose'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    const width = Game.display.renderWidth;
    const height = Game.display.renderHeight;

    const container = new PIXI.Container();

    const barHeight = 12;
    const barL = new PIXI.Graphics();
    barL.beginFill(0, .5);
    barL.drawRect(0, 0, width, barHeight)
    barL.endFill();
    const barR = barL.clone();
    barR.y = barHeight;

    barL.x = -width;
    barR.x = width;
    container.addChild(barL, barR);
    container.y = height/2;
    container.pivot.y = container.height/2;

    const text = new PIXI.BitmapText('LOSE', fonts.title);
    text.anchor.set(.6);
    text.position.set(width/2, container.height/2);
    text.alpha = 0;
    container.addChild(text);

    Game.hud.addChild(container);

    const transitionTime = .2;
    const fadeDelay = .065;
    const fadeTime = transitionTime - fadeDelay;
    const showTime = 1.3;

    const cleanup = () => {
      container.destroy({children: true});
      this.advance();
    }

    Timer
      .at(.15)          // Bar transition
      .tween(transitionTime, barL, {x: 0}, Ease.sine.inOut)
      .tween(transitionTime, barR, {x: 0}, Ease.sine.inOut)

      .wait(fadeDelay)  // Text fade-in during bar transition
      .tween(fadeTime, text, {alpha: 1}, Ease.sine.inOut)

      .wait()
      .wait(showTime)   // Scale-out transition w/ slight fade-out to complement
      .tween(transitionTime, container, {alpha: 0.7}, Ease.sine.inOut)
      .tween(transitionTime, container, {scale: {y: 0}})
      .tween(transitionTime, text, {skew: {x: -1}})
      
      .at('end')
      // .do(n => cleanup())
      .do(n => this.advance(GameEnd))
  }
}