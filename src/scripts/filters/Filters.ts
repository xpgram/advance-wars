

export const Filters = {
  TintSpotlight: function () {
    const filter = new PIXI.Filter('', '', {one: 1, two: 2});
    filter.uniforms.one = 10;

    // Are filter.uniforms' property members recognized by the linter?
    // I could describe the type myself, I guess.

    // Design:
    // Current strategy is just to return the filter as is; every tile
    // will have its own uniforms. Wasteful, but... eh.
    // This gives each tile absolute control over its tint color, however.
    //
    // If this is *too* wasteful, there are only two tint colors used by
    // AW, I'm pretty sure.
    // Either:
    // - Have filters for each size and color combination; four.
    // - Have two filters, one for each size, and use sprite.tint to
    //   affect the correct color. I disprefer this one because sprite
    //   tinting is subtractive, but it wouldn't not work.
  },
}