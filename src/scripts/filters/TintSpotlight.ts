import fragment from "./TintSpotlight.glsl";

// TODO Ensure the frag is imported as a string or whatever.
// I heard it mentioned I might need ts-shader-loader?

/** TintSpotlight shader settings.
 * Be sure to update uniforms.time by frame delta to animate. */
export const uniforms = {
  spotlightRange: [1,2],
  spotlightWidth: .5,
  dimensions: [1,1],
  offset: [0,1],
  tint: [.6,.6,.6],
  time: 0,
};

/** Colored tint and rotating bright spot that travels squarely around drawspace boundaries. */
export const tintSpotlight = new PIXI.Filter('', fragment, uniforms);