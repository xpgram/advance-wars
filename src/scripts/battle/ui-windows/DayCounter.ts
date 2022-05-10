import { PIXI } from "../../../constants";
import { Palette } from "../../color/ColorPalette";
import { fonts } from "./DisplayInfo";
import { Fadable } from "./Fadable";


export class DayCounter {
  
  container = new PIXI.Container();

  private labelBack = new PIXI.Graphics();
  private label = new PIXI.BitmapText('D', fonts.dayCounter);

  private textBack = new PIXI.Graphics();
  private text  = new PIXI.BitmapText('0', fonts.dayCounter);

  constructor() {
    this.labelBack.addChild(this.label);
    this.textBack.addChild(this.text);
    this.container.addChild(this.textBack, this.labelBack);

    this.container.scale.set(.5);
    
    this.rebuildGraphics();
  }

  destroy() {
    this.container.destroy({children: true});
  }

  get count() { return this._count; }
  set count(n) {
    this._count = n;
    this.text.text = String(this._count);
    this.rebuildGraphics();
  }
  private _count = 0;

  private rebuildGraphics() {
    this.createBackground(this.textBack, this.text);
    this.createBackground(this.labelBack, this.label);
    this.textBack.y = this.labelBack.height - 2;
  }

  private createBackground(g: PIXI.Graphics, t: PIXI.BitmapText) {
    const color = Palette.gale_force1;
    const shadow = Palette.black;
  
    const xoff = (t.text[0] === '1') ? 1 : 0;

    t.position.set(1+xoff,0);
    const width = Math.max(t.width, 13)+2+xoff;
    const height = t.height;

    g.clear();

    g.beginFill(shadow);
    g.drawRect(2, 2, width, height);
    g.endFill();

    g.beginFill(color);
    g.drawRect(0, 0, width, height);
    g.endFill();
  }

}