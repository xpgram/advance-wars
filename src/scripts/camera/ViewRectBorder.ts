

export class ViewRectBorder {

  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;

  constructor({left, right, top, bottom}: {left?: number, right?: number, top?: number, bottom?: number} = {}) {
    this.left = left || 0;
    this.right = right || 0;
    this.top = top || 0;
    this.bottom = bottom || 0;
  }

  equal(b: ViewRectBorder) {
    return (
      this.left === b.left
      && this.right === b.right
      && this.top === b.top
      && this.bottom === b.bottom
    );
  }

  add(b: ViewRectBorder): ViewRectBorder {
    return new ViewRectBorder({
      left: this.left + b.left,
      right: this.right + b.right,
      top: this.top + b.top,
      bottom: this.bottom + b.bottom,
    });
  }

  subtract(b: ViewRectBorder): ViewRectBorder {
    return new ViewRectBorder({
      left: this.left - b.left,
      right: this.right - b.right,
      top: this.top - b.top,
      bottom: this.bottom - b.bottom,
    });
  }

  toString() {
    const { top, left, bottom, right} = this;
    return `${left} ${top} ${right} ${bottom}`;
  }
}