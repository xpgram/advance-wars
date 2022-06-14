import { PIXI } from "../../../constants";
import { Palette } from "../../color/ColorPalette";
import { Map } from "./Map";
import { Point } from "pixi.js";


/**  */
// TODO It also needs reference to camera to draw the view border.
export class MiniMap {

  private map: Map;

  container = new PIXI.Container();
  private iconContainer = new PIXI.Container();

  constructor(map: Map) {
    this.map = map;
    this.container.addChild(this.iconContainer);
    this.updateContents();
    this.buildBackground();
  }

  destroy() {
    //@ts-ignore
    this.map = undefined;
    this.container.destroy({children: true});
  }

  updateContents() {
    this.iconContainer.removeChildren().forEach( c => c.destroy() );
    
    for (let x = 0; x < this.map.width; x++)
    for (let y = 0; y < this.map.height; y++) {
      const square = this.map.squareAt(new Point(x,y));

      const terrIcon = square.terrain.getMinimapIcon();
      const unitIcon = square.unit?.getMinimapIcon();
      
      const size = terrIcon.width;
      const pos = new Point(x*size, y*size);

      terrIcon.position.set(pos.x, pos.y);
      this.iconContainer.addChild(terrIcon);
      
      if (unitIcon) {
        unitIcon.position.set(pos.x, pos.y);
        this.iconContainer.addChild(unitIcon);
      }
    }
  }

  private buildBackground() {
    const hBorder = 3;
    const vBorder = 1;

    const g = new PIXI.Graphics();
    g.beginFill(Palette.gale_force2);
    g.drawRect(
      -hBorder,
      -vBorder,
      this.container.width + hBorder*2,
      this.container.height + vBorder*2,
    );
    g.endFill();
    this.container.addChildAt(g, 0);
  }

  show() {
    this.container.visible = true;
  }

  hide() {
    this.container.visible = false;
  }

}