import { Game } from "../../../..";
import { Ease } from "../../../Common/EaseMethod";
import { ImmutablePointPrimitive, Point } from "../../../Common/Point";
import { Rectangle } from "../../../Common/Rectangle";
import { Timer } from "../../../timer/Timer";
import { fonts } from "../../ui-windows/DisplayInfo";
import { TurnState } from "../TurnState";


/** Shows the current player's begin-turn animation sweep. */
export class PlayerCard extends TurnState {
  get type() { return PlayerCard; }
  get name() { return 'PlayerCard'; }
  get revertible() { return false; }
  get skipOnUndo() { return true; }

  timer!: Timer;
  container!: PIXI.Container;

  configureScene() {
    const { players } = this.assets;

    const { renderWidth: rw, renderHeight: rh } = Game.display;
    const point = (x: number, y: number) => new Point(x,y);
    const hide = -200;

    // Construct temp player card.

    // Insig  - 1
    const insignia = this.newRect({
      g: new PIXI.Graphics(),
      dim: point(96,96),
      pos: point(rw*.75,rh*.5),
    });
    insignia.alpha = 0;

    // Day    - 1
    const dayCard = this.newRect({
      g: new PIXI.Graphics(),
      dim: point(24,16),
      pos: point(hide, rh*.25),
    });
    const dayText = new PIXI.BitmapText('Day', fonts.title);
    dayText.anchor.set(.5);
    dayText.position.set(dayCard.width/2, dayCard.height/2);
    dayCard.addChild(dayText);

    // #      - 2
    const dayNumCard = this.newRect({
      g: new PIXI.Graphics(),
      dim: point(32,32),
      pos: point(hide, rh*.425),
    })
    const dayNumText = new PIXI.BitmapText(`${players.day}`, fonts.title);
    dayNumText.anchor.set(.5);
    dayNumText.position.set(dayNumCard.width/2, dayNumCard.height/2);
    dayNumCard.addChild(dayNumText);

    // Map    - 1.5
    const mapCard = this.newRect({
      g: new PIXI.Graphics(),
      dim: point(128,16),
      pos: point(hide, rh*.625),
    })
    mapCard.pivot.x = 0;
    const mapText = new PIXI.BitmapText(`Land's End`, fonts.script);
    mapText.anchor.set(.5,.5);
    mapText.position.set(mapCard.width*.65, mapCard.height/2);
    mapCard.addChild(mapText);

    // Fight  - 3
    const fightCard = this.newRect({
      g: new PIXI.Graphics(),
      dim: point(64,24),
      pos: point(hide, rh*.8),
    })
    const fightText = new PIXI.BitmapText(`Fight!`, fonts.title);
    fightText.anchor.set(.5);
    fightText.position.set(fightCard.width/2, fightCard.height/2);
    fightCard.addChild(fightText);

    // Left-side mover
    const driftContainer = new PIXI.Container();
    driftContainer.addChild(dayCard, dayNumCard, fightCard);

    // Destructable
    this.container = new PIXI.Container();
    this.container.addChild(insignia, mapCard, driftContainer);

    Game.hud.addChild(this.container);

    // Define animation tweens

    const slideTime = .35;
    const delay = .5;
    const waitTime = 1.0;
    const motion = Ease.circ;
    const fade = Ease.sine.inOut;

    this.timer = Timer
      .at(.15)

      .tween( (slideTime+delay*1.5)*1.5 + waitTime, n => {
        driftContainer.x = rw*.2 + 16*n;
      })

      .tween(1.0, n => {
        n = fade(n);
        insignia.alpha = n;
      })
      .tween(slideTime, n => {
        n = motion.out(n);
        dayCard.x = hide * (1-n);
      })
      .wait(delay/2)
      .tween(slideTime, n => {
        n = fade(n);
        mapCard.x = hide * (1-n) - 8;
      })
      .wait(delay/2)
      .tween(slideTime, n => {
        n = motion.out(n);
        dayNumCard.x = hide * (1-n);
      })
      .wait(delay/2)
      .tween(slideTime, n => {
        n = motion.out(n);
        fightCard.x = hide * (1-n);
      })

      .wait()
      .wait(waitTime)

      .tween(1.0, n => {
        n = fade(n);
        insignia.alpha = 1-n;
      })
      .tween(slideTime, n => {
        n = motion.in(n);
        dayCard.x = -hide*1.5 * n;
      })
      .tween(slideTime*1.5, n => {
        mapCard.scale.y = 1-n;
        mapCard.skew.x = -2*n;    // This conflicts with scale
        mapCard.alpha = 1 - Ease.sine.in(n);
      })
      .wait(delay*.65)
      .tween(slideTime, n => {
        n = motion.in(n);
        dayNumCard.x = -hide*1.5 * n;
      })
      .wait(delay/2*.65)
      .tween(slideTime, n => {
        n = motion.in(n);
        fightCard.x = -hide*1.5 * n;
      })

      .at('end')
      .do(n => {
        this.advance();
      })
  }

  update() {
    const { gamepad } = this.assets;

    if (gamepad.button.A.pressed) {
      this.timer.destroy();
      this.advance();
    }
  }

  close() {
    this.container.destroy({children: true});
  }

  // Temp
  private newRect(o: {
    g: PIXI.Graphics,
    dim: ImmutablePointPrimitive,
    pos: ImmutablePointPrimitive,
  }) {
    const {g, dim, pos} = o;

    g.beginFill(0, .5);
    g.drawRect(0, 0, dim.x, dim.y);
    g.endFill();
    g.position.set(pos.x, pos.y);
    g.pivot.set(g.width/2, g.height/2);
    return g;
  }

}