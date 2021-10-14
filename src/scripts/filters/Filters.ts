

export const Filters = {
  TintSpotlight: function () {
    const filter = new PIXI.Filter('', '', {one: 1, two: 2});
    filter.uniforms.one = 10;

    // Are filter.uniforms' property members recognized by the linter?
    // I could describe the type myself, I guess.

    // Design:
    // Considering I have to use the tile whitemasks regardless (so
    // that the ground layer can be cached, for instance), I probably
    // should just have one or two versions of these uniforms and
    // use Pixi to tint the mask for free.
  },
}