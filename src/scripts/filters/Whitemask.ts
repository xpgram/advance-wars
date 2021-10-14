import fragment from "./Whitemask.glsl";

/** White silhouette in the shape of the filtered image; preserves alpha channel. */
export const whitemask = new PIXI.Filter('', fragment, {});