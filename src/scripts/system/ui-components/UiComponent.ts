import { Game } from "../../..";
import { PIXI } from "../../../constants";


// TODO Look for UiWidget somewhere. I've already described the basics.
// It'll need to be modified a bit, though.
// I want vaguely CSS-like behavior.
// Every UiComponent should manage its list of children, maneuvering them into
// HTML-style wraps according to some max-width.
//
// The simple interpretation is that width determines which elements are on a
// line, and the height of each line is the largest of those elements.
// Where to place each child, then, is a simple calculation.


export class UiComponent {
  // TODO UiComponent has its own show/hide functionality,
  // Fadable(UiComponent) overrides this default behavior.

  readonly container = new PIXI.Container();

    // container.children can be used to arrange objects
    // but what about references?
    //
    // UiSystem already has 1-billion references because they can't be
    // containerized.


  constructor() {
    Game.scene.ticker.add(this.update, this);
  }

  destroy() {
    this.container.destroy({children: true});
    Game.scene.ticker.remove(this.update, this);
  }

  protected update() {
    // TODO What do? Anything?
  }

  /** Iterates through container.children, positioning them in a CSS-like way
   * according to their widths and heights. */
  arrangeChildren() {

  }

  show() {
    this.container.visible = true;
  }

  hide() {
    this.container.visible = false;
  }

}