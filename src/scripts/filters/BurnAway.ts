import { Filter } from "pixi.js";
import { Point } from "../Common/Point";
import fragment from "./BurnAway.fs.glsl";


export class BurnAway {

  readonly uniforms = {
    origin: [0,0],
    slider: 0,
    seed: 0,      // ..? For noise?
  }

  readonly filter = new Filter('', fragment, this.uniforms);

  constructor(origin: Point) {
    this.uniforms.origin = [origin.x, origin.y];
  }

}
