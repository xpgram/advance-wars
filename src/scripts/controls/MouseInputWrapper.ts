import { Game } from "../..";
import { Point } from "../Common/Point";
import { Common } from "../CommonUtils";
import { Button } from "../controls/Button";
import { ButtonMap } from "../controls/ButtonMap";

/// Experimental MouseController class

type InteractionEvent = PIXI.interaction.InteractionEvent;
type FederatedWheelEvent = PIXI.FederatedWheelEvent;

// TODO Supposedly this might not work with Macs or left-handed mice
enum MouseButtonMap {
  Left = 0,
  Middle = 1,
  Right = 2,
  Fourth = 3,
  Fifth = 4,
}

/** A wrapper for Pixi Containers which need greater sophistication or direct-state
 * referencing for their mouse-event handling. Automatically handles queries such as
 * mouse-button hold time.  
 * Note: Pixi's own listener events are likely capable of handling most clickable button
 * tasks, this observer is intended for more complex control systems, or to homogenize
 * button.released reference structures.
 **/
 export class MouseInputWrapper {

  readonly button = {
    [MouseButtonMap.Left]:   new Button(new ButtonMap(MouseButtonMap.Left,  0,0,0)),
    [MouseButtonMap.Middle]: new Button(new ButtonMap(MouseButtonMap.Middle,0,0,0)),
    [MouseButtonMap.Right]:  new Button(new ButtonMap(MouseButtonMap.Right, 0,0,0)),
    [MouseButtonMap.Fourth]: new Button(new ButtonMap(MouseButtonMap.Fourth,0,0,0)),
    [MouseButtonMap.Fifth]:  new Button(new ButtonMap(MouseButtonMap.Fifth, 0,0,0)),
  }

  private getButton(event: InteractionEvent): Button {
    return this.button[event.data.button as MouseButtonMap];
  }

  // Eh. It works though.
  private skipUpdateButtonState = false;

  // scrollUp: Button;
  // scrollDown: Button;
  // scrollWheel: Axis2D;
    // increments to 0 by .05 every frame
    // scroll 'buttons' increment away from 0 by .2 per input
    // when scroll dir changes, zero-out, then increment as normal
    // change scroll dir does not untilt axis

  /** Pointer coordinates relative to this Container's origin. */
  private localPosition = new Point();

  /** Pointer coordinates relative to this Container's origin; captured on left press event. */
  private localPressedPosition = new Point();

  /** Returns a Point object corresponding to the pointer's coordinates relative to
   * the associated Container's origin. */
  getPosition() { return this.localPosition.clone() }

  /** Whether the pointer is within this Container's bounds or not. */
  private _mouseHovering: boolean = false;

  /**  */
  // TODO actually, I don't know.
  get hovering() { return this._mouseHovering; }

  /**  */
  dragged = false;

  /**  */
  clicked(/* support for multiple buttons */) {
    return this.button[0].released && !this.dragged;
  }

  /** The graphical subject being managed by this mouse state observer. */
  readonly container: PIXI.Container;


  constructor(container: PIXI.Container) {
    container.addListener('mousemove', this.updateMousePosition, this);
    container.addListener('mousedown', this.mouseDownHandler, this);
    container.addListener('mouseup', this.mouseUpHandler, this);
    // container.addListener('wheel', this.mouseWheelHandler, this);

    container.interactive = true;
    this.container = container;
    Game.scene.ticker.add(this.updateButtonStates, this);
  }

  destroy() {
    this.container.removeListener('mousemove', this.updateMousePosition, this);
    this.container.removeListener('mousedown', this.mouseDownHandler, this);
    this.container.removeListener('mouseup', this.mouseUpHandler,this);
    this.container.interactive = false; // I'm assuming for now I will never assign two controllers to one container.
    Game.scene.ticker.remove.remove(this.updateButtonStates, this);
  }

  private updateButtonStates() {
    if (this.skipUpdateButtonState)
      this.skipUpdateButtonState = false
    else
      Object.values(this.button).forEach( b => b.update(b.down) );
  }

  private updateMousePosition(event: InteractionEvent) {
    const local = event.data.getLocalPosition(this.container);
    this.localPosition.set(local);
    if (this.button[0].pressed)
      this.localPressedPosition.set(local);

    const wasHovering = this._mouseHovering;
    this._mouseHovering = (
      Common.within(local.x, 0, this.container.width) &&
      Common.within(local.y, 0, this.container.height)
    );

    if (this.button[0].down && this.localPosition.distance(this.localPressedPosition) > 2)
      this.dragged = true;

    if (wasHovering && !this._mouseHovering)
      Object.values(this.button).forEach( b => b.cancel() );
  }

  private mouseDownHandler(event: InteractionEvent) {
    const button = this.getButton(event);
    if (this._mouseHovering) {
      button.update(true);
      this.skipUpdateButtonState = true;
    }

    this.updateMousePosition(event);
    event.stopPropagation();  // Prevents underneaths from triggering.
  }

  private mouseUpHandler(event: InteractionEvent) {
    this.getButton(event).update(false);
    this.updateMousePosition(event);
    this.skipUpdateButtonState = true;
    this.dragged = false;

    if (this._mouseHovering)   // TODO Does this hover-guard do what I expect?
      event.stopPropagation();
  }

  private mouseWheelHandler(event: FederatedWheelEvent) {
    // stub; follow down/up implementation
  }

  /** True if this controller is listening for inputs. */
  get enabled() { return this.container.interactive; }
  set enabled(b) {
    this.container.interactive = b;
    if (!b)
      Object.values(this.button).forEach( b => b.reset() );
  }

}
