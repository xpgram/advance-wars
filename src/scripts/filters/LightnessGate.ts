import fragment from "./LightnessGate.glsl";


export class LightnessGate {

  readonly uniforms = {
    //
  }

  readonly filter = new PIXI.Filter<typeof this.uniforms>('', fragment, this.uniforms);

  constructor() {
    //
  }

}