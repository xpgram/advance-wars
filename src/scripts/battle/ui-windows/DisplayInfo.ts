
// TODO All of these are linked to in the battle scene.
// What if this was imported from a different scene? How can I guarantee
// the assets are actually available?

// TODO Keep the asset import strings here as well; at least then I'd
// only have to edit one file. I mean, I would still have to edit the
// linking call, but the proper details would all be in one place.

// TODO What about bundling fonts?
// I could have a master with all details and several smaller sub bundles that pick
// from master. Then in the War scene, you would reference fonts via the WarFonts bundle.

export interface BitmapFont {
  fontName: string;
  fontSize: number;
}

function getBitmapFont(fontName: string, fontSize: number): BitmapFont {
  return { fontName, fontSize };
}

export const fonts = {
  title:          getBitmapFont('font-title', 10),
  scriptOutlined: getBitmapFont('font-map-ui', 14),
  smallScriptOutlined: getBitmapFont('font-small-ui', 12),
  script:         getBitmapFont('font-script', 10),
  list:           getBitmapFont('font-table-header', 6),
  menu:           getBitmapFont('font-menu', 12),         // I don't know the correct fontSize for this one
  dayCounter:     getBitmapFont('font-day-ui', 24),
  playerSplash:   getBitmapFont('font-player-splash', 35),
  tectac:         getBitmapFont('TecTacRegular', 8),
};


