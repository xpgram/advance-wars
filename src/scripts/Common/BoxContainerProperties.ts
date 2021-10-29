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
 * 
 * Children are assumed to be staged vertically for simplicity.
 */
export class BoxContainerProperties {

  private _width = 0;
  private _height = 0;
  minWidth = 0;
  minHeight = 0;
  margin = { left: 0, right: 0, top: 0, bottom: 0 };
  border = { left: 0, right: 0, top: 0, bottom: 0 };
  padding = { left: 0, right: 0, top: 0, bottom: 0 };

  children: BoxContainerProperties[] = [];

  constructor(options: {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
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
    children?: BoxContainerProperties[];
  }) {
    function getOption(v?: number) {
      return (v !== undefined) ? v : 0;
    }

    function getQuad(
      quad: Quad,
      quadOptions?: { left?: number, right?: number, top?: number, bottom?: number }
    ) {
      if (quadOptions !== undefined) {
        quad.left = getOption(quadOptions.left);
        quad.right = getOption(quadOptions.right);
        quad.top = getOption(quadOptions.top);
        quad.bottom = getOption(quadOptions.bottom);
      }
    }

    this._width = getOption(options.width);
    this._height = getOption(options.height);
    this.minWidth = getOption(options.minWidth);
    this.minHeight = getOption(options.minHeight);
    getQuad(this.margin, options.margin);
    getQuad(this.border, options.border);
    getQuad(this.padding, options.padding);

    this.children = options.children || [];
  }

  merge(properties?: BoxContainerProperties): BoxContainerProperties {

    function boxPropsToLiteral(box?: BoxContainerProperties) {
      const { width, height, minWidth, minHeight,
        margin, border, padding } = properties || {};
      return {
        width, height, minWidth, minHeight,
        margin, border, padding,
      }
    }

    const newPropsLiteral = boxPropsToLiteral(properties);
    const thisPropsLiteral = boxPropsToLiteral(this);
    const mergePropsLiteral = {
      ...thisPropsLiteral,  // I'm pretty sure this isn't deep.
      ...newPropsLiteral,   // margin defaults will be missed.
    }
    
    return new BoxContainerProperties(mergePropsLiteral);
  }

  // TODO nth-child element position

  /** The maximum value from set width or calculated width.
   * Setting this property affects the set width only. */
  get width() {
    // Assumes no children are aligned horizontally.
    const contentWidth = this.children.map(b => b.containerBox().width).reduce((m, n) => Math.max(m, n), 0);
    return Math.max(this._width, contentWidth, this.minWidth);
  }
  set width(n: number) {
    this._width = n;
  }

  /** The maximum value from set height or calculated height.
   * Setting this property affects the set height only. */
  get height() {
    // Assumes all children are aligned vertically.
    const contentHeight = this.children.map(b => b.containerBox().height).reduce((s, n) => s + n, 0);
    return Math.max(this._height, contentHeight, this.minHeight);
  }
  set height(n: number) {
    this._height = n;
  }

  /** Total width of the element including content, borders, padding and margins. */
  get elementWidth() {
    return this.containerBox().width;
  }

  /** Total height of the element including content, borders, padding and margins. */
  get elementHeight() {
    return this.containerBox().height;
  }

  /** Builds a rectangle object from a list of spacing properties. */
  private buildRect(outer: Quad[], inner: Quad[]) {
    const x = outer.map(b => b.left).reduce((s, n) => s + n, 0);
    const y = outer.map(b => b.top).reduce((s, n) => s + n, 0);
    const w = inner.map(b => b.left + b.right).reduce((s, n) => s + n, 0) + this.width;
    const h = inner.map(b => b.top + b.bottom).reduce((s, n) => s + n, 0) + this.height;
    return new Rectangle(x, y, w, h);
  }

  /** The box encapsulating the content space. */
  contentBox() {
    return this.buildRect([this.margin, this.border, this.padding], []);
  }

  /** The box encapsulating the border-contained space. */
  borderInnerBox(): Rectangle {
    return this.buildRect([this.margin, this.border], [this.padding]);
  }

  /** The box encapsulating the content border. */
  borderOuterBox(): Rectangle {
    return this.buildRect([this.margin], [this.border, this.padding]);
  }

  /** The box encapsulating the element in its entirety. */
  containerBox(): Rectangle {
    return this.buildRect([], [this.margin, this.border, this.padding]);
  }
}