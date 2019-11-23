import * as PIXI from "pixi.js";

type BackgroundOptions = {
    offset?: {
        x: number,
        y: number,
    }
    width: number,
    height: number,
    color: number,
    alpha: number,
    border?: {
        color: number,
        top: number,
        bottom: number,
        left: number,
        right: number
    }
}

/**
 * Returns a new PIXI.Graphics object describing a bordered rectangle.
 */
export function RectBuilder(options: BackgroundOptions) {
    let background = new PIXI.Graphics();

    let x = (options.offset) ? options.offset.x : 0;
    let y = (options.offset) ? options.offset.y : 0;

    // Main fill
    background.beginFill(options.color, options.alpha);
    background.drawRect(x, y, options.width, options.height);
    background.endFill();

    // Border
    if (options.border) {
        background.beginFill(options.border.color, options.alpha);
        background.drawRect(x, y, options.width, options.border.top);
        background.drawRect(x, y + options.height, options.width, -options.border.bottom);
        background.drawRect(x, y, options.border.left, options.height);
        background.drawRect(x + options.width, y, -options.border.right, options.height);
        background.endFill();
    }

    background.zIndex = -1;
    return background;
}