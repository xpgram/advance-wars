import { Game } from "../..";
import { Point } from "../Common/Point";
import { Common } from "../CommonUtils";
import { Button } from "../controls/Button";
import { Keys } from "./KeyboardObserver";

type InteractionEvent = PIXI.interaction.InteractionEvent;

/** A wrapper for Pixi Containers which need greater sophistication or direct-state
 * referencing for their mouse-event handling. Automatically handles queries such as
 * mouse-button hold time.  
 * Note: Pixi's own listener events are likely capable of handling most clickable button
 * tasks, this observer is intended for more complex control systems, or to homogenize
 * button.released reference structures.
 **/
 export class ClickableContainer {

  // TODO Build consistent frame behavior into Button so I don't have to manage this.
  // Button will use time-stamps (framecounts) to determine press and release event procession.
  private skipNextButtonUpdate = false;

  /** Object managing pointer button state. */
  readonly button = new Button();

  /** Keeps track of drag state. */
  private dragButton = new Button();

  /** Whether the pointer has moved during a continuous button-down event. */
  get pointerDragging() { return this.dragButton.down; }

  /** Trigger pulse flag for whether the pointer has started moving during a continuous button-down event. */
  get pointerDragStarted() { return this.dragButton.pressed; }

  /** Trigger pulse flag for whether the pointer button has released after a drag state. */
  get pointerDragStopped() { return this.dragButton.released; }

  /** Returns a Point object: the pointer's coordinates relative to its Container's origin. */
  pointerLocation() { return this._pointerLocation.clone() }
  private _pointerLocation = new Point();

  /** Returns a Point object: the pointer's coordinates relative to its Container's origin
   * during last button-pressed event. */
  pointerPressedLocation() { return this._pointerLastPressLocation.clone(); }
  private _pointerLastPressLocation = new Point();

  /** Whether the pointer is hovering over the managed Container. */
  get pointerWithin() { return this._pointerWithin; }
  private _pointerWithin: boolean = false;

  /** Whether the pointer has moved this frame. */
  get pointerMoved() { return this._pointerMoved; }
  private _pointerMoved: boolean = false;

  /** Returns true if this Container has been 'clicked': a button-release event without pointer dragging. */
  clicked() { return this.button.released && this.dragButton.up && !this.dragButton.released; }

  /** The graphical subject being managed by this mouse state observer. */
  readonly container: PIXI.Container;


  constructor(container: PIXI.Container) {
    container.addListener('mousemove', this.updateMousePosition, this);
    container.addListener('mousedown', this.mouseDownHandler, this);
    container.addListener('mouseup', this.mouseUpHandler, this);
    container.interactive = true;

    this.container = container;
    Game.scene.ticker.add(this.updateButtonState, this);
  }

  destroy() {
    this.container.removeListener('mousemove', this.updateMousePosition, this);
    this.container.removeListener('mousedown', this.mouseDownHandler, this);
    this.container.removeListener('mouseup', this.mouseUpHandler,this);
    this.container.interactive = false; // I'm assuming for now I will never assign two controllers to one container.
    Game.scene.ticker.remove.remove(this.updateButtonState, this);
  }

  /** Update step which passes current down-state back into the pointer button to
   * facilitate the Button object's routine functions. */
  private updateButtonState() {
    if (!this.skipNextButtonUpdate) {
      this.button.update(this.button.down);
      this.dragButton.update(this.dragButton.down);
      this._pointerMoved = false;
    }
    this.skipNextButtonUpdate = false;
  }

  /** Updates the virtual pointer with the position of the observed pointer. */
  private updateMousePosition(event: InteractionEvent) {
    const local = event.data.getLocalPosition(this.container);
    this._pointerLocation.set(local);
    if (this.button.pressed)
      this._pointerLastPressLocation.set(local);

    const wasHovering = this._pointerWithin;
    this._pointerWithin = (
      Common.within(local.x, 0, this.container.width) &&
      Common.within(local.y, 0, this.container.height)
    );

    this._pointerMoved = true;
    this.skipNextButtonUpdate = true;

    if (this.button.down && this._pointerLocation.distance(this._pointerLastPressLocation) > 2)
      this.dragButton.update(true);

    if (wasHovering && !this._pointerWithin) {
      this.button.cancel();
      this.dragButton.cancel();
    }
  }

  /** Updates the virtual pointer with a button-down event. Also updates the pointer's location. */
  private mouseDownHandler(event: InteractionEvent) {
    if (this._pointerWithin) {
      this.button.update(true);
      this.skipNextButtonUpdate = true;
    }
    this.updateMousePosition(event);
    event.stopPropagation();  // Prevents underneaths from triggering.
  }

  /** Updates the virtual pointer with a button-up event. Also updates the pointer's location. */
  private mouseUpHandler(event: InteractionEvent) {
    this.button.update(false);
    this.dragButton.update(false);
    this.skipNextButtonUpdate = true;
    this.updateMousePosition(event);

    if (this._pointerWithin)  // TODO Does this hover-guard do what I expect?
      event.stopPropagation();
  }

  /** True if this controller is listening for inputs. */
  get enabled() { return this.container.interactive; }
  set enabled(b) {
    this.container.interactive = b;
    if (!b) {
      this.button.reset();
      this.dragButton.reset();
    }
  }

}
