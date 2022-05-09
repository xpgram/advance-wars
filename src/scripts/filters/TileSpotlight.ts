import { Point } from "../Common/Point";
import fragment from "./TileSpotlight.fs.glsl";


/** Adds a spotlight effect which squarely rotates about the given dimensions.
 * Be sure to call update() to manage to rotation effect.
 */
export class TileSpotlight {

  protected readonly uniforms = {
    dimensions: [16,32],
    maxTime: 1,
    time: 0,
  };

  readonly filter = new PIXI.Filter<typeof this.uniforms>('', fragment, this.uniforms);

  constructor(width: number, height: number, timeLength: number) {
    this.uniforms.dimensions = [width, height];
    this.uniforms.maxTime = timeLength;
  }

  update(dt: number) {
    this.uniforms.time += dt * .03;
  }

}
