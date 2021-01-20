import { Rectangle } from "pixi.js";

type Quad = {
    left: number,
    right: number,
    top: number,
    bottom: number
}

/**
 * Describes the content relationships between graphical elements.
 * Objects are simply abstract sets of properties describing such.
 */
export class BoxContainerProperties {

    width   = 0;
    height  = 0;
    margin  = {left: 0, right: 0, top: 0, bottom: 0};
    border  = {left: 0, right: 0, top: 0, bottom: 0};
    padding = {left: 0, right: 0, top: 0, bottom: 0};

    constructor(options: {
        width?: number;
        height?: number;
        margin?: {
            left?: number,
            right?: number,
            top?: number,
            bottom?: number,
        }
        border?: {
            left?: number,
            right?: number,
            top?: number,
            bottom?: number,
        }
        padding?: {
            left?: number,
            right?: number,
            top?: number,
            bottom?: number,
        }
    }) {
        function getOption(v?: number) {
            return (v !== undefined) ? v : 0;
        }

        function getQuad(
            quad: Quad,
            quadOptions?: {left?: number, right?: number, top?: number, bottom?: number}
        ) {
            if (quadOptions !== undefined) {
                quad.left   = getOption(quadOptions.left);
                quad.right  = getOption(quadOptions.right);
                quad.top    = getOption(quadOptions.top);
                quad.bottom = getOption(quadOptions.bottom);
            }
        }

        this.width = getOption(options.width);
        this.height = getOption(options.height);
        getQuad(this.margin, options.margin);
        getQuad(this.border, options.border);
        getQuad(this.padding, options.padding);
    }

    private buildRect(outer: Quad[], inner: Quad[]) {
        const x = outer.map(b => b.left).reduce((s,n) => s+n, 0);
        const y = outer.map(b => b.top ).reduce((s,n) => s+n, 0);
        const w = inner.map(b => b.left + b.right).reduce((s,n) => s+n, 0) + this.width;
        const h = inner.map(b => b.top + b.bottom).reduce((s,n) => s+n, 0) + this.height;
        return new Rectangle(x, y, w, h);
    }

    contentBox() {
        return this.buildRect([this.margin, this.border, this.padding], []);
    }

    borderInnerBox(): Rectangle {
        return this.buildRect([this.margin, this.border], [this.padding]);
    }

    borderOuterBox(): Rectangle {
        return this.buildRect([this.margin], [this.border, this.padding]);
    }

    containerBox(): Rectangle {
        return this.buildRect([], [this.margin, this.border, this.padding]);
    }
}