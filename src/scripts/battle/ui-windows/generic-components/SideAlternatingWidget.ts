import { UiWidget } from "./UiWidget";


/**  */
export abstract class SideAlternatingWidget extends UiWidget {
  // TODO A copy of SlidingWindow, mostly

  /**  */
  side = ViewSide.Left;

  /**  */
  get refreshable() { return this._refreshable; }
  private _refreshable = true;

  /** The pixel distance of the right-side boundary of the viewport.
   * This distance is where this widget will slide in from when showing on the right side. */
  readonly viewportWidth: number;

  // TODO Emit events 'refreshable' and 'sidechange'
  // This way drawer-types can switch which side they slide in from without
  // having to be coupled here somewhere.
}