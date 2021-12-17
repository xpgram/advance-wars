import { Rectangle } from "pixi.js";

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

  zoom: number;

  rotation: number;

  real: Rectangle;    // Current transformation
  final: Rectangle;   // End-state after all planned transformations (zoom)

  constructor() {
    
  }
}