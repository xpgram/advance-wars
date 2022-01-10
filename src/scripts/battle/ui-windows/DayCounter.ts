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
    this.textBack.y = this.labelBack.height;

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
  }

  private createBackground(g: PIXI.Graphics, dim: {width: number, height: number}) {
    const color = 0x29424A;
    const shadow = 0x000000;

    const width = Math.max(dim.width, 15);
    const height = dim.height;

    g.clear();

    g.beginFill(shadow);
    g.drawRect(2, 2, width, height);
    g.endFill();

    g.beginFill(color);
    g.drawRect(0, 0, width, height);
    g.endFill();
  }

}