import { Point } from "../../../Common/Point";

export type WidgetSettings = {
  position: Point,
  origin?: Point,
}

const DefaultWidgetSettings = {
  origin: new Point(),
}

/** Essentially, a PIXI.Container with constructor settings. */
export class UiWidget { // extends Fadable ← But move to this folder first.

  readonly container = new PIXI.Container();

  constructor(options: WidgetSettings) {
    options = {...DefaultWidgetSettings, ...options};
    const { position, origin } = options;

    // Containers don't have anchors/origins. I don't think pivot works, but I guess it's worth asking.
    // In any case, I think I'll have to private container and force update position/anchor myself whenever
    // children are updated or whatever.
    // Can I add a listener to a Container?
    this.container.position.set(position.x, position.y);
    this.container.on('childAdded', () => {}, this);  // width/height may have changed
    this.container.on('removedFrom', () => {}, this); // width/height may have changed
  }

}