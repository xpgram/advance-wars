
// TODO All of these are linked to in the battle scene.
// What if this was imported from a different scene? How can I guarantee
// the assets are actually available?

// TODO Keep the asset import strings here as well; at least then I'd
// only have to edit one file. I mean, I would still have to edit the
// linking call, but the proper details would all be in one place.

export const fonts = {
    title: {fontName: 'font-title', fontSize: 10},
    scriptOutlined: {fontName: 'font-map-ui', fontSize: 14},
    smallScriptOutlined: {fontName: 'font-small-ui', fontSize: 12},
    script: {fontName: 'font-script', fontSize: 10},
    list: {fontName: 'font-table-header', fontSize: 6},
    menu: {fontName: 'font-menu', fontSize: 12},            // I don't know the correct fontSize for this one
    dayCounter: {fontName: 'font-day-ui', fontSize: 24},
    playerSplash: {fontName: 'font-player-splash', fontSize: 35},
    tectac: {fontName: 'TecTacRegular', fontSize: 8},
}