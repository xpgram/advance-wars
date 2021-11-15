import * as PixiFilters from 'pixi-filters';
import { Game } from "../../..";
import { Common } from '../../CommonUtils';
import { fonts } from './DisplayInfo';
import { Fadable } from './Fadable';


export class DamageForecastPane extends Fadable {
  
  /** The graphical object for this UI element. */
  readonly container = new PIXI.Container();

  /** The graphical window object for this UI element. */
  private readonly window: PIXI.Sprite;

  /** The graphical text (damage number) displayed on this UI element. */
  private readonly damageNumber: PIXI.BitmapText;

  private readonly colorFilters = {
    safe: new PixiFilters.ColorReplaceFilter(
      [0,0,0],
      [0, 1, .45]
    ),
    normal: new PixiFilters.ColorReplaceFilter(
      [0,0,0],
      [0, 1, 1]
    ),
    caution: new PixiFilters.ColorReplaceFilter(
      [0,0,0],
      [1, 1, .31]
    ),
    danger: new PixiFilters.ColorReplaceFilter(
      [0,0,0],
      [1, .29, .31]
    ),
  };
  // TODO I wanted to animate the brightness, too. Make it shimmer, you know.

  /** The forecasted damage number to display. */
  get damage() { return this.damageNumber.text; }
  set damage(n) {
    this.damageNumber.text = Common.clamp(n, 0, 999).toString();
  }

  /** The warning-mode the forecast is in. Sets the background color, basically. */
  get mode() { return this._mode; }
  set mode(mode: 'safe' | 'normal' | 'caution' | 'danger') {
    if (!Object.keys(this.colorFilters).includes(mode))
      throw new Error(`Color mode '${mode}' does not exist in filters repository.`);
    //@ts-expect-error
    this.window.filters = [this.colorFilters[mode]];
    this._mode = mode;
  }
  private _mode: 'safe' | 'normal' | 'caution' | 'danger' = 'safe';

  constructor() {
    super();
    const sheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;
    this.window = new PIXI.Sprite(sheet.textures['damage-forecast-pane.png']);
    this.damageNumber = new PIXI.BitmapText('', fonts.scriptOutlined);
    this.damageNumber.position.set(23,5);
    this.damageNumber.anchor.set(1,0);
    this.container.addChild(this.window, this.damageNumber);
    this.damage = 0;
    this.mode = 'safe';
  }

}