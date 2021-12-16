import { Rectangle } from "pixi.js";

export class ViewRect {

  // Currently, I think, all camera transform stuff gon' be extracted here.
  // camera.frame.world({postZoom: true})
  // camera.frame.subject()
  // camera.frame.center.x = n


  real: Rectangle;    // Current transformation
  final: Rectangle;   // End-state after all planned transformations (zoom)

  constructor() {
    
  }
}