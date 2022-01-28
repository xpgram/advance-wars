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

    Timer
      .at(.1)
      .tween(.1, n => {
        barL.x = -width*(1-n);
      })
      .wait(.03)
      .tween(.1, n => {
        barR.x = width*(1-n);
      })
      .wait(.03)
      .tween(.1, n => {
        text.alpha = n;
      })
      .at(1.5)
      .tween(.15, n => {
        container.scale.y = (1-n);
        text.skew.x = -n;
      })
      .wait(.1)
      .tween(.1, n => {
        container.alpha = (1-n);
      })
      .at('end')
      .do(n => {
        container.destroy({children: true});
        this.advance();
      })
  }
}