import { Game } from "../../../..";
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

    const barInTime = .18;
    const barInDelay = barInTime / 3;
    const textInTime = barInTime - barInDelay;
    const outTime = barInTime;
    const showTime = 1.3;

    Timer
      .at(.15)
      .tween(barInTime, n => {
        barL.x = -width*(1-n);
      })
      .wait(barInDelay)
      .tween(barInTime, n => {
        barR.x = width*(1-n);
      })
      .wait(barInDelay)
      .tween(textInTime, n => {
        text.alpha = n;
      })
      .wait()
      .wait(showTime)
      .tween(outTime, n => {
        container.scale.y = (1-n);
        text.skew.x = -n;
      })
      .wait(barInDelay)
      .tween(outTime, n => {
        container.alpha = (1-n);
      })
      .at('end')
      .do(n => {
        container.destroy({children: true});
        this.advance();
      })
  }
}