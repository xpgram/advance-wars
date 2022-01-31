import { Game } from "../../../..";
import { Ease } from "../../../Common/EaseMethod";
import { Timer } from "../../../timer/Timer";
import { fonts } from "../../ui-windows/DisplayInfo";
import { TurnState } from "../TurnState";

export class GameWin extends TurnState {
  get type() { return GameWin; }
  get name() { return 'GameWin'; }
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

    const text = new PIXI.BitmapText('WIN', fonts.title);
    text.anchor.set(.6);
    text.position.set(width/2, container.height/2);
    text.alpha = 0;
    container.addChild(text);

    Game.hud.addChild(container);

    const transitionTime = .2;
    const fadeDelay = .065;
    const fadeTime = transitionTime - fadeDelay;
    const showTime = 1.3;

    Timer
      .at(.15)          // Bar transition
      .tween(transitionTime, n => {
        n = Ease.sine.inOut(n);
        barL.x = -width*(1-n);
        barR.x = width*(1-n);
      })
      .wait(fadeDelay)  // Text fade-in during bar transition
      .tween(fadeTime, n => {
        n = Ease.sine.inOut(n);
        text.alpha = n;
      })
      .wait()
      .wait(showTime)   // Scale-out transition w/ slight fade-out to complement
      .tween(transitionTime, n => {
        container.scale.y = (1-n);
        container.alpha = 1 - Ease.sine.inOut(n)*.3;
        text.skew.x = -n;
      })
      .at('end')
      .do(n => {
        container.destroy({children: true});
        this.advance();
      })
  }
}