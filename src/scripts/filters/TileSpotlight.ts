import fragment from "./TileSpotlight.glsl";

/** TintSpotlight shader settings.
 * Be sure to update uniforms.time by frame delta to animate. */
export const uniforms = {
  dimensions: [16,32],
  time: 0,
};

/** Colored tint and rotating bright spot that travels squarely around drawspace boundaries. */
export const tileSpotlight = new PIXI.Filter<typeof uniforms>('', fragment, uniforms);

/** Update-step function for the filter's uniforms. */
export function updateUniforms(dt: number) {
  uniforms.time += dt * .03;
}

/** Unified object-package containing references to each object of this filter's function. */
export const TileSpotlight = {
  uniforms,
  filter: tileSpotlight,
  updateStep: updateUniforms,
}