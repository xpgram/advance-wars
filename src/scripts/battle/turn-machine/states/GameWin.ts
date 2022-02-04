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

    // TODO Whiteout should probably be a scene transition. I haven't made or
    // thought of those yet. Perhaps soon.
    const preWhiteout = new PIXI.Graphics();
    preWhiteout.beginFill(0xEEEEEE);
    preWhiteout.drawRect(0,0, width, height);
    preWhiteout.endFill();
    preWhiteout.alpha = 0;
    preWhiteout.blendMode = PIXI.BLEND_MODES.ADD;

    const whiteout = new PIXI.Graphics();
    whiteout.beginFill(0xDDDDDD);
    whiteout.drawRect(0,0, width, height);
    whiteout.endFill();
    whiteout.alpha = 0;
    whiteout.blendMode = PIXI.BLEND_MODES.SCREEN;

    Game.hud.addChild(container, preWhiteout, whiteout);

    const whiteoutTime = 2.5;
    const transitionTime = .2;
    const fadeDelay = .065;
    const fadeTime = transitionTime - fadeDelay;
    const showTime = 1.3;

    const cleanup = () => {
      container.destroy({children: true});
      preWhiteout.destroy();
      whiteout.destroy();
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

      .at(1.25)
      .tween(whiteoutTime, preWhiteout, {alpha: 1}, Ease.circ.in)
      .tween(whiteoutTime, whiteout, {alpha: 1}, Ease.circ.in)

      .at('end')
      .wait(.5)
      .do(n => cleanup())
  }
}