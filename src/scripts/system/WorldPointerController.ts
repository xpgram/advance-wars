import { Game } from "../..";
import { MapCursor } from "../battle/map/MapCursor";
import { Point } from "../Common/Point";
import { Common } from "../CommonUtils";
import { Axis2D } from "../controls/Axis";
import { Button } from "../controls/Button";
import { ButtonMap } from "../controls/ButtonMap";


interface Options {
  readonly stage: PIXI.Container,
  readonly mapCursor: MapCursor;
}

// TODO This is currently located in src/scripts/system, and it's hard to want to move it.
// If it's going to be there (here), though, it needs to be generalized.
// This is a controller object much like VirtualGamepad and it needs to be integrated with
// the more global systems; BattleSceneControllers should add the cursor behavior, this
// script shouldn't be coupled.

// If the above is to be considered, however, what am I factoring out, exactly?
// Game.stage already has all the tools I need.
// What's needed isn't this managing class, it's an aptly named handle to alleviate
// vagueness in the code.

// 'mousemove' actually isn't a good option, either. Unless I drastically rethink implementation.
// - When zoomed in, the cursor still obeys the camera's subject rect.
// - The mouse might stay still beyond the subject rect, meaning:
//   - mousemove will cease firing
//   - mapcursor will *not* continue chasing the mouse
// - This completely neglects tap events.
//   - The user would rather tap and drag the map around, but there is no functionality
//     for that.
// - Truthfully, I would rather use mousewheel and ?? to scroll the camera than I would
//   have it chase my pointer; that feels hella weird.

export class WorldPointerController {

  // TODO I need to consider how this might be generalized to any clickable container.
  // I may have written about this above, actually. Idk, different day.
  // 
  // Like VirtualGamepad, I want the inner-workings to reduce to a referenceable state
  // so that IssueOrderStart can ask `mouse.lmb.pressed` and be smoothly integrated with
  // the existing controls infrastructer.
  // 
  // I did not implement a listener pattern with VGP, which may come with disadvantages,
  // but it's mostly fine aside of the inherit busy work in constantly checking controller
  // state.
  //
  // I think what I might do is write a general click interface which gets attached to
  // a given Container, and then write an inheriting interface for Map which modifies
  // the click location to be a board location instead of a real one.
  // That makes sense to me.
  //
  // Do keep in mind, this'll probably only be used by Map anyway; Pixi's 'click' events
  // are already quite manageable. I'm just trying to integrate the mouse-map functions
  // with the existing keyboard-map, gamepad-map ones.

  private options: Options;

  // TODO Pass in MouseObserver so we may reference button state
  // TODO Make MouseObserver an extension of VirtualGamepad and just pass that in?
  //      Like, I could shift+click or shift+scroll if I allowed that.
  onClick?: (location: Point) => void;


  constructor(options: Options) {
    this.options = options;

    const { stage, mapCursor } = this.options;
    const tileSize = Game.display.standardLength;

    stage.addListener('mousemove', (e) => {
      if (!mapCursor.enabled)
        return;
      const pointer_raw = new Point(e.data.getLocalPosition(stage));
      const mapPos = pointer_raw.apply(n => Math.floor(n / tileSize));
      mapCursor.animateTo(mapPos);
    })
    stage.addListener('mousedown', (e) => {
      if (!mapCursor.enabled || !this.onClick)
        return;
      const pointer_raw = new Point(e.data.getLocalPosition(stage));
      const mapPos = pointer_raw.apply(n => Math.floor(n / tileSize));
      mapCursor.teleportTo(mapPos);
      this.onClick(mapPos);
    })
  }

  destroy() {
    const { stage } = this.options;
    stage.interactive = false;
    stage.removeAllListeners(); // Am I the only one?

    //@ts-ignore
    this.options = undefined;

  }

  get enabled() { return this.options.stage.interactive; }
  set enabled(b) { this.options.stage.interactive = b; }

}


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
    const button = this.getButton(event);

    if (this.dragged)
      button.cancel();

    button.update(false);
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
