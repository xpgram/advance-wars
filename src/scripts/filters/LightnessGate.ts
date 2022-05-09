import fragment from "./LightnessGate.fs.glsl";


export class LightnessGate {

  readonly uniforms = {
    //
  }

  readonly filter = new PIXI.Filter<typeof this.uniforms>('', fragment, this.uniforms);

  constructor() {
    //
  }

}