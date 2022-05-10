import { PIXI } from "../../constants";
import fragment from "./LightnessGate.fs.glsl";


export class LightnessGate {

  readonly uniforms = {
    //
  }

  readonly filter = new PIXI.Filter('', fragment, this.uniforms);

  constructor() {
    //
  }

}