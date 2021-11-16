import * as PixiFilters from 'pixi-filters';
import { Game } from "../../..";
import { Slider } from '../../Common/Slider';
import { Common } from '../../CommonUtils';
import { Pulsar } from '../../timer/Pulsar';
import { fonts } from './DisplayInfo';
import { Fadable } from './Fadable';


export class DamageForecastPane extends Fadable {
  
  /** The graphical object for this UI element. */
  readonly container = new PIXI.Container();

  /** The graphical window object for this UI element. */
  private readonly window: PIXI.Sprite;

  /** The graphical text (damage number) displayed on this UI element. */
  private readonly damageNumber: PIXI.BitmapText;

  private readonly colorModes = {
    safe:     [0,   1, .45],
    normal:   [0,   1,   1],
    caution:  [1,   1, .31],
    danger:   [1, .29, .31],
  };

  private readonly colorFilter = new PixiFilters.ColorReplaceFilter(
    [0,0,0],
    this.colorModes.safe,
  );

  private shimmer = new Slider({
    max: 2,
    granularity: 1 / 10,
    shape: v => {
      const r = 1 - (v % 1);            // Descending heartbeat
      return Math.floor(r * 3) * .333;  // Quantize
    },
  });

  private shimmerPulsar = new Pulsar(
    {
      firstInterval: 45,
      interval: 90,
    },
    () => {
      this.shimmer.track = 'min';
    },
    this
  )

  private verticalOscillate = new Slider({
    max: 2,
    granularity: 1,
    looping: true,
  });

  private motionPulsar = new Pulsar(
    20,
    () => {
      this.verticalOscillate.decrement();
      this.window.y = -this.verticalOscillate.output;
      this.damageNumber.y = 5 - this.verticalOscillate.output;
    },
    this
  )

  /** The forecasted damage number to display. */
  get damage() { return this.damageNumber.text; }
  set damage(n) {
    this.damageNumber.text = Common.clamp(n, 0, 999).toString();
  }

  /** The warning-mode the forecast is in. Sets the background color, basically. */
  get mode() { return this._mode; }
  set mode(mode: 'safe' | 'normal' | 'caution' | 'danger') {
    if (!Object.keys(this.colorModes).includes(mode))
      throw new Error(`Color mode '${mode}' does not exist in filters repository.`);
    this.setColor();
    this._mode = mode;

    // Reset shimmer timer
    this.shimmer.track = 'max';
    this.shimmerPulsar.reset();
  }
  private _mode: 'safe' | 'normal' | 'caution' | 'danger' = 'safe';

  constructor() {
    super();
    const sheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;

    this.window = new PIXI.Sprite(sheet.textures['damage-forecast-pane.png']);
    //@ts-expect-error
    this.window.filters = [this.colorFilter];

    this.damageNumber = new PIXI.BitmapText('', fonts.scriptOutlined);
    this.damageNumber.position.set(23,5);
    this.damageNumber.anchor.set(1,0);
    this.container.addChild(this.window, this.damageNumber);

    this.damage = 0;
    this.mode = 'safe';
    
    this.motionPulsar.start();
    this.shimmerPulsar.start();

    Game.scene.ticker.add(this.update, this);
  }

  destroy() {
    this.container.destroy({children: true});
    this.motionPulsar.destroy();
    this.shimmerPulsar.destroy();
    Game.scene.ticker.remove(this.update, this);
  }

  update() {
    this.shimmer.increment();
    this.setColor();
  }

  private setColor() {
    const b = (!this.shimmer.equalsMax())
      ? this.shimmer.output
      : 0;
    const color = this.colorModes[this.mode].map( v => v + .8*(1-v)*b );
    this.colorFilter.newColor = color;
  }

}