import { ButtonState } from "./ButtonState";
import { ButtonMap } from "./ButtonMap";

/** Describes a single button on the virtual controller. Self-manages pressed/down/released state. */
export class Button {

  /** Contains button and key codes this Button will observe for input. */
  map: ButtonMap;
  // TODO Include button / key names with serial mapping.
  // I'll probably use an enum, at least for controllers;
  // I want the option to use pictures, etc.

  /** Button state: either up, down, pressed or released. */
  private _state = ButtonState.Up;

  /** Whether to skip the Released state on button up. */
  private _releaseCancelled = false;

  /** The frames since this button's last raw-input state change. */
  get framesHeld() { return this._framesHeld; };
  private _framesHeld = 0;

  /** The time in seconds since this button's last raw-input state change.  
   * // Note: Not implemented; time is inferred from framecount. */
  get timeHeld() { return this._framesHeld / 60; }
  // private _timer = ;


  constructor(map: ButtonMap) {
    this.map = map;
  }

  // Button polling methods
  get pressed() { return this._state === ButtonState.Pressed; }
  get down() { return this._state === ButtonState.Down || this.pressed; }
  get held() { return this.down && this._framesHeld > 8; } // TODO Unhardcode the frames (n/60 seconds)
  get released() { return this._state === ButtonState.Released; }
  get up() { return this._state === ButtonState.Up || this.released; }
  get changed() { return this.pressed || this.released; }

  /** Updates a button state to the one given and handles clerical details. */
  private changeState(state: ButtonState) {
    this._state = state;
    this._framesHeld = 0;
  }

  /** Given a raw input signal (pressed/unpressed), update this button's state. */
  update(buttonDown: boolean) {
    const { Down, Up, Pressed, Released } = ButtonState;
    this._framesHeld++;

    // Absolve single-frame states
    if (this.pressed) this.changeState(Down);
    if (this.released) this.changeState(Up);
    if (this._releaseCancelled) {
      this.changeState(Up);
      this._releaseCancelled = false;
    }

    // Affect state if there's been a change
    if (this.up && buttonDown) this.changeState(Pressed);
    if (this.down && !buttonDown) this.changeState(Released);
  }

  /** Resets the button state; sets it to 'Up' instantly. */
  reset() {
    this._state = ButtonState.Up;
  }

  /** On next update(), changes to 'Up' state, skipping 'Released'. */
  cancel() {
    this._releaseCancelled = true;
  }

  /** Reconfigures this button's input-serial mapping for gamepads and keyboards. */
  remap(map: ButtonMap) {
    this.map = map;
  }

}