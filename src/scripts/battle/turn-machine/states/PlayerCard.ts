import { PIXI } from '../../../../constants';
import { Game } from "../../../..";
import { MultiColorReplaceFilter } from 'pixi-filters';
import { Ease } from "../../../Common/EaseMethod";
import { PixiUtils } from '../../../Common/PixiUtils';
import { Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { fonts } from "../../ui-windows/DisplayInfo";
import { TurnState } from "../TurnState";

// TODO I need to figure out what to do with these.

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

const paletteSwapsText: (readonly [number, number])[][] = [
  [ // Red → Red
    [0x000000, 0x000000],
  ],
  [ // Red → Blue
    [0x310808, 0x002131],
    [0x4A0808, 0x00427B],
    [0xCE9C9C, 0x9CB5CE],
    [0x521818, 0x103952],
    [0x8C2929, 0x185A84],
    [0xA55A5A, 0x527BA5],
    [0xC68C8C, 0x84A5BD],
    [0x9C4242, 0x396B94],
    [0xB57373, 0x6B94AD],
    [0xE7CECE, 0xCEDEE7],
    [0xF7E7E7, 0xE7EFF7],
    [0xDEB5B5, 0xB5C6D6],
  ],
  [ // Red → Yellow
    [0x000000, 0x000000],
    [0x310808, 0x312900],
    [0x4A0808, 0x7B6310],
    [0xCE9C9C, 0xCEBDA5],
    [0x521818, 0x4A4218],
    [0x8C2929, 0x8C6B29],
    [0xA55A5A, 0xA58C5A],
    [0xC68C8C, 0xBDAD8C],
    [0x9C4242, 0x947B42],
    [0xB57373, 0xB59C73],
    [0xE7CECE, 0xE7DED6],
    [0xF7E7E7, 0xF7EFE7],
    [0xDEB5B5, 0xD6CEBD],
  ],
  [ // Red → Black
    [0x000000, 0x000000],
    [0x310808, 0x181818],
    [0xFFFFFF, 0xE7E7E7],
    [0x4A0808, 0x5A635A],
    [0xCE9C9C, 0xADB5AD],
    [0x521818, 0x424242],
    [0x8C2929, 0x636B63],
    [0xA55A5A, 0x848C84],
    [0xC68C8C, 0xA5A5A5],
    [0x9C4242, 0x737B73],
    [0xB57373, 0x949494],
    [0xE7CECE, 0xCECECE],
    [0xF7E7E7, 0xDEDEDE],
    [0xDEB5B5, 0xBDBDBD],
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
    const { players, map } = this.assets;

    // TODO This is confusing. I need... I want to say 'scene.spritesheets.UiGraphics' or something.
    // Game.scene is vague, though; I think that's why I do it this way. Should I host it on assets, then?
    const sheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;

    const { renderWidth: rw, renderHeight: rh } = Game.display;
    const point = (x: number, y: number) => new Point(x,y);
    const hide = 200;
    const driftOrbitAxis = rw*.25;

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
    const dayText = new PIXI.BitmapText('D', fonts.playerSplash);
    dayText.position.set(-hide, rh*.25);
    dayText.anchor.set(.5);

    // #      - 2
    const dayNumText = new PIXI.BitmapText(`${players.day}`, fonts.playerSplash);
    dayNumText.position.set(-hide, rh*.40);
    dayNumText.anchor.set(.5);

    // Map    - 1.5
    const mapText = PixiUtils.limitBitmapTextToWidth(
      new PIXI.BitmapText(map.name, fonts.script), 106 );
    mapText.position.set(6, 4);
    mapText.anchor.set(0.5, 0);
    
    const mapCard = new PIXI.BitmapText(`---------]`, fonts.playerSplash);
    mapCard.position.set(-hide*1.25, rh*.60);
    mapCard.anchor.x = .55;
    mapCard.pivot.y = mapCard.height/2;
    mapCard.addChild(mapText);

    // Fight  - 3
    const fightText = new PIXI.BitmapText(`F`, fonts.playerSplash);
    fightText.position.set(-hide, rh*.80);
    fightText.anchor.set(.5);

    // Left-side mover
    const driftContainer = new PIXI.Container();
    driftContainer.addChild(dayText, dayNumText, fightText);
    driftContainer.x = driftOrbitAxis - 8;

    // UI Element palette swap container
    const uiRecolor = new PIXI.Container();
    uiRecolor.addChild(mapCard, driftContainer);
    uiRecolor.filters = [new MultiColorReplaceFilter(paletteSwapsText[playerColor])];

    // Destructable
    this.container = new PIXI.Container();
    this.container.addChild(insignia, uiRecolor);

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
      .tween(slideTime, dayText, {x: 0}, motion.out)
      .tween(mapCardTime, mapCard, {x: driftOrbitAxis}, Ease.sine.inOut)

      .wait(delay)
      .tween(slideTime, dayNumText, {x: 0}, motion.out)

      .wait(delay/2)
      .tween(slideTime, fightText, {x: 0}, motion.out)

      .wait()
      .wait(waitTime)
      .tween(insigniaFadeTime, insignia, {alpha: 0}, Ease.sine.inOut)
      .tween(slideTime, dayText, {x: hide*1.5}, motion.in)
      .tween(mapCardTime, mapCard, {
        scale: {y: 0},
        skew: {x: -2},  // This conflicts with scale
      })
      .tween(mapCardTime, mapCard, {alpha: 0}, Ease.sine.in)

      .wait(delay)
      .tween(slideTime, dayNumText, {x: hide*1.5}, motion.in)

      .wait(delay/2)
      .tween(slideTime, fightText, {x: hide*1.5}, motion.in)
      
      .at('end')
      .do(n => { this.advance(); })
  }

  update() {
    const { gamepad, stagePointer } = this.assets;

    if (gamepad.button.A.pressed || stagePointer.clicked() ) {
      this.timer.destroy();
      this.advance();
    }
  }

  close() {
    this.container.destroy({children: true});
  }

}
