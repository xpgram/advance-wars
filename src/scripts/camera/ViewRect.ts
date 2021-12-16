
export class ViewRect {

  // I don't think ViewRect, a framing tool for camera, needs to know all this.
  // But it can return a PIXI.Rect or my own; I probs gonna write my own 'cause I like to.
  // I love math, yo.

  // basic: x, y, width, height, left, right, top, bottom
  // camera: ?? (I forgot to be thinkin' 'bout it)
  // .rect => getter returns Rectangle object
  // .rect => setter conforms camera properties such that this ViewRect is equivalent to the given one

  constructor() {
    
  }
}