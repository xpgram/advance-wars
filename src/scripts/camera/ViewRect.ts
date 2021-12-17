import { Rectangle } from "pixi.js";
import { Game } from "../..";
import { Point } from "../Common/Point";

export class ViewRect {

  // That's interesting...
  // What if I maintained 'multiple' cameras for each zoom level?
  // How would we do that...
  //
  // I feel awkward about including animation sliders in camera; doesn't feel
  // like that's what Camera.ts is for, you know?
  // Multiple cameras, though...
  // 
  // I think that maybe the camera should factor zoom in itself when setting
  // properties, so I don't have to do it like ~everywhere~.
  // 
  // In the rest of the application, I only want to know what the camera can
  // actually, literally see. I don't care about zoom, I don't care about decimals,
  // I just want to know what ~real world~ coordinates the camera is fuckin' wit.
  // And additionally, I want to know what the ideal frame is, the 1.0 zoom frame;
  // those coords don't move, baby.
  // Center also shouldn't move on zoom, so I want the camera defined from those.
  // You can still set from TL, though.

  // Currently, I think, all camera transform stuff gon' be extracted here.
  // camera.frame.world({postZoom: true})
  // camera.frame.subject()
  // camera.frame.center.x = n

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