import fragment from "./Whitemask.fs.glsl";

/** White silhouette in the shape of the filtered image; preserves alpha channel. */
export class Whitemask {

  readonly uniforms = {
    //
  }

  readonly filter = new PIXI.Filter<typeof this.uniforms>('', fragment, this.uniforms);

  constructor() {
    //
  }

}