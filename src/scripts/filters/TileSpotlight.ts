import fragment from "./TileSpotlight.glsl";

/** TintSpotlight shader settings.
 * Be sure to update uniforms.time by frame delta to animate. */
export const uniforms = {
  spotlightRange: [1,2],
  spotlightWidth: .5,
  dimensions: [1,1],
  offset: [0,1],
  tint: [.6,.6,.6],   // TODO Setting this to blue seems to achieve nothing. Is spotlight even being applied?
  time: 0,
};

/** Colored tint and rotating bright spot that travels squarely around drawspace boundaries. */
export const tileSpotlight = new PIXI.Filter('', fragment, uniforms);

/** Update-step function for the filter's uniforms. */
export function updateUniforms(dt: number) {
  uniforms.time += dt * .02;
}

/** Unified object-package containing references to each object of this filter's function. */
export const TileSpotlight = {
  uniforms,
  filter: tileSpotlight,
  updateStep: updateUniforms,
}