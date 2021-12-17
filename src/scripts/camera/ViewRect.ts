import { Rectangle } from "pixi.js";
import { Game } from "../..";
import { Point } from "../Common/Point";

export class ViewRect {

  // This class describes a camera transform. Simple as.

  center: Point = new Point();
  get width() { return Game.display.renderWidth * this.zoom; }
  get height() { return Game.display.renderHeight * this.zoom; }
  get x()  { return this.center.x - 0.5*this.width; }
  set x(n) { this.center.x = n + 0.5*this.width; }
  get y()  { return this.center.y - 0.5*this.height; }
  set y(n) { this.center.y = n + 0.5*this.height; }
  horizontalBorder: number = 0;
  verticalBorder: number = 0;
  zoom: number = 1;
  rotation: number = 0;

  /**  */
  worldRect() {
    return new Rectangle(
      this.x,
      this.y,
      this.width,
      this.height,
    )
  }

  /**  */
  subjectRect() {
    const { x, y, width, height, horizontalBorder, verticalBorder } = this;
    return new Rectangle(
      x + horizontalBorder,
      y + verticalBorder,
      width - 2*horizontalBorder,
      height - 2*verticalBorder,
    )
  }

  /**  */
  idealRect() {
    const { center } = this;
    const { renderWidth, renderHeight } = Game.display;
    return new Rectangle(
      center.x - .5*renderWidth,
      center.y - .5*renderHeight,
      renderWidth,
      renderHeight,
    )
  }


  constructor() {
    
  }
}