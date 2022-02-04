import { ColorOverlayFilter } from 'pixi-filters';
import { Game } from "../../../..";
import { Ease } from "../../../Common/EaseMethod";
import { ImmutablePointPrimitive, Point } from "../../../Common/Point";
import { NumericDictionary } from "../../../CommonTypes";
import { Timer } from "../../../timer/Timer";
import { Faction } from "../../EnumTypes";
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

    // TODO This is confusing. I need... I want to say 'scene.spritesheets.UiGraphics' or something.
    // Game.scene is vague, though; I think that's why I do it this way. Should I host it on assets, then?
    const sheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;

    const { renderWidth: rw, renderHeight: rh } = Game.display;
    const point = (x: number, y: number) => new Point(x,y);
    const hide = 200;

    const recolor = [
      [ // Red
        new ColorOverlayFilter(0xFF1400, .25),
        (function() {
          const f = new PIXI.filters.ColorMatrixFilter();
          f.contrast(.15);
          // f.brightness(.975);
          return f;
        })(),
      ],
      [ // Blue
        new ColorOverlayFilter(0x1800FF, .20),
        (function() {
          const f = new PIXI.filters.ColorMatrixFilter();
          f.contrast(.15);
          // f.brightness(.975);
          return f;
        })(),
      ],
      [ // Yellow
        new ColorOverlayFilter(0xFFDD00, .325),
        (function() {
          const f = new PIXI.filters.ColorMatrixFilter();
          f.contrast(.20);  // TODO ..? No effect?
          // f.brightness(.975);
          return f;
        })(),
      ],
      [ // Black
        new ColorOverlayFilter(0x330022, .35),
        (function() {
          const f = new PIXI.filters.ColorMatrixFilter();
          f.contrast(.20);
          // f.brightness(.9);
          return f;
        })(),
      ],
    ]

    // Construct temp player card.

    // Insig  - 1
    const insignia = new PIXI.Sprite(players.current.officer.insigniaSplash);
    insignia.filters = recolor[players.current.playerNumber];
    insignia.position.set(rw*.75, rh*.5);
    insignia.alpha = 0;

    // Day    - 1
    const dayCard = this.newRect({
      g: new PIXI.Graphics(),
      dim: point(24,16),
      pos: point(-hide, rh*.25),
    });
    const dayText = new PIXI.BitmapText('Day', fonts.title);
    dayText.anchor.set(.5);
    dayText.position.set(dayCard.width/2, dayCard.height/2);
    dayCard.addChild(dayText);

    // #      - 2
    const dayNumCard = this.newRect({
      g: new PIXI.Graphics(),
      dim: point(32,32),
      pos: point(-hide, rh*.425),
    })
    const dayNumText = new PIXI.BitmapText(`${players.day}`, fonts.title);
    dayNumText.anchor.set(.5);
    dayNumText.position.set(dayNumCard.width/2, dayNumCard.height/2);
    dayNumCard.addChild(dayNumText);

    // Map    - 1.5
    const mapCard = this.newRect({
      g: new PIXI.Graphics(),
      dim: point(128,16),
      pos: point(-hide, rh*.625),
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
      pos: point(-hide, rh*.8),
    })
    const fightText = new PIXI.BitmapText(`Fight!`, fonts.title);
    fightText.anchor.set(.5);
    fightText.position.set(fightCard.width/2, fightCard.height/2);
    fightCard.addChild(fightText);

    // Left-side mover
    const driftContainer = new PIXI.Container();
    driftContainer.addChild(dayCard, dayNumCard, fightCard);
    driftContainer.x = rw*.20;

    // Destructable
    this.container = new PIXI.Container();
    this.container.addChild(insignia, mapCard, driftContainer);

    Game.hud.addChild(this.container);

    // Define animation tweens

    const insigniaFadeTime = 1.0;
    const slideTime = .35;
    const mapCardTime = .50;
    const delay = .35;
    const waitTime = 1.0;
    const driftTime = (slideTime + delay*1.5)*2 + waitTime;
    const motion = Ease.circ;

    this.timer = Timer
      .at(.15)
      .tween(driftTime, driftContainer, {x: driftContainer.x + 16}) //, Ease.quantize(Ease.linear.out, 16))
      .tween(insigniaFadeTime, insignia, {alpha: 1}, Ease.sine.inOut)
      .tween(slideTime, dayCard, {x: 0}, motion.out)
      .tween(mapCardTime, mapCard, {x: -8}, Ease.sine.inOut)

      .wait(delay)
      .tween(slideTime, dayNumCard, {x: 0}, motion.out)

      .wait(delay/2)
      .tween(slideTime, fightCard, {x: 0}, motion.out)

      .wait()
      .wait(waitTime)
      .tween(insigniaFadeTime, insignia, {alpha: 0}, Ease.sine.inOut)
      .tween(slideTime, dayCard, {x: hide*1.5}, motion.in)
      .tween(mapCardTime, mapCard, {
        scale: {y: 0},
        skew: {x: -2},  // This conflicts with scale
      })
      .tween(mapCardTime, mapCard, {alpha: 0}, Ease.sine.in)

      .wait(delay)
      .tween(slideTime, dayNumCard, {x: hide*1.5}, motion.in)

      .wait(delay/2)
      .tween(slideTime, fightCard, {x: hide*1.5}, motion.in)
      
      .at('end')
      .do(n => { this.advance(); })
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