import { MultiColorReplaceFilter } from 'pixi-filters';
import { Game } from "../../../..";
import { Ease } from "../../../Common/EaseMethod";
import { ImmutablePointPrimitive, Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { fonts } from "../../ui-windows/DisplayInfo";
import { TurnState } from "../TurnState";


const paletteSwaps = [
  [ // Red → Red
    [0x000000, 0x000000],
  ],
  [ // Red → Blue
    [0x633131, 0x29425A],
    [0xF7B5B5, 0xC6DEDE],
    [0xDE8484, 0x7BADC6],
    [0xEFA5A5, 0xA5D6D6],
    [0xCE7373, 0x6B9CB5],
    [0xBD6B6B, 0x528CAD],
    [0xFFDEDE, 0xEFEFFF],
    [0xEF9C9C, 0x94BDCE],
    [0x7B4242, 0x29526B],
    [0xAD5A5A, 0x427B94],
    [0xFFC6C6, 0xD6DEEF],
    [0x8C4A4A, 0x316384],
  ],
  [ // Red → Yellow
    [0x633131, 0x845A18],
    [0xF7B5B5, 0xF7E79C],
    [0xDE8484, 0xE7CE73],
    [0xEFA5A5, 0xEFDE8C],
    [0xCE7373, 0xDEBD5A],
    [0xBD6B6B, 0xD6BD42],
    [0xFFDEDE, 0xFFF7C6],
    [0xEF9C9C, 0xEFDE8C],
    [0x7B4242, 0x8C6B29],
    [0xAD5A5A, 0xBD9C39],
    [0xFFC6C6, 0xF7E7AD],
    [0x8C4A4A, 0xA58C31],
    [0xFFFFFF, 0xFFFFD6],
  ],
  [ // Red → Black
    [0x633131, 0x313931],
    [0xF7B5B5, 0xA5ADA5],
    [0xDE8484, 0x848C84],
    [0xEFA5A5, 0x9CA59C],
    [0xCE7373, 0x738473],
    [0xBD6B6B, 0x737B73],
    [0xFFDEDE, 0xBDBDBD],
    [0xEF9C9C, 0x9CA59C],
    [0x7B4242, 0x4A4A4A],
    [0xAD5A5A, 0x636B63],
    [0xFFC6C6, 0xADB5AD],
    [0x8C4A4A, 0x525252],
    [0xFFFFFF, 0xC6C6C6],
  ],
];


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

    // Construct temp player card.

    // Insig  - 1
    const insignia = new PIXI.Container();
    
    const splash = new PIXI.Sprite(players.current.officer.insigniaSplash);
    const playerColor = players.current.playerNumber;
    splash.filters = [new MultiColorReplaceFilter(paletteSwaps[playerColor])];
    splash.position.set(rw*.75, rh*.5);
    splash.cacheAsBitmap = true;

    insignia.addChild(splash);
    insignia.alpha = 0;

    // Day    - 1
    const dayCard = this.newRect({
      g: new PIXI.Graphics(),
      dim: point(24,16),
      pos: point(-hide, rh*.20),
    });
    const dayText = new PIXI.BitmapText('Day', fonts.title);
    dayText.anchor.set(.5);
    dayText.position.set(dayCard.width/2, dayCard.height/2);
    dayCard.addChild(dayText);

    // #      - 2
    const dayNumCard = this.newRect({
      g: new PIXI.Graphics(),
      dim: point(32,32),
      pos: point(-hide, rh*.39),
    })
    const dayNumText = new PIXI.BitmapText(`${players.day}`, fonts.title);
    dayNumText.anchor.set(.5);
    dayNumText.position.set(dayNumCard.width/2, dayNumCard.height/2);
    dayNumCard.addChild(dayNumText);

    // Map    - 1.5
    const mapCard = this.newRect({
      g: new PIXI.Graphics(),
      dim: point(256,16),
      pos: point(-256, rh*.60),
    })
    mapCard.pivot.x = 0;
    const mapText = new PIXI.BitmapText(`Land's End`, fonts.script);
    mapText.anchor.set(.5,.5);
    mapText.position.set(mapCard.width*.825, mapCard.height/2);
    mapCard.addChild(mapText);

    // Fight  - 3
    const fightCard = this.newRect({
      g: new PIXI.Graphics(),
      dim: point(64,24),
      pos: point(-hide, rh*.77),
    })
    const fightText = new PIXI.BitmapText(`Fight!`, fonts.title);
    fightText.anchor.set(.5);
    fightText.position.set(fightCard.width/2, fightCard.height/2);
    fightCard.addChild(fightText);

    // Left-side mover
    const driftContainer = new PIXI.Container();
    driftContainer.addChild(dayCard, dayNumCard, fightCard);
    driftContainer.x = rw*.25 - 8;

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
      .tween(mapCardTime, mapCard, {x: -128}, Ease.sine.inOut)

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