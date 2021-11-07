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

    /** The frames (more accurately: update calls) since this button's last raw-input state change. */
    get framesStateHeld() { return this._framesStateHeld; };
    private _framesStateHeld = 0;
    
    constructor(map: ButtonMap) {
        this.map = map;
    }

    // Button polling methods
    get pressed() { return this._state == ButtonState.Pressed; }
    get down() { return this._state == ButtonState.Down || this.pressed; }
    get released() { return this._state == ButtonState.Released; }
    get up() { return this._state == ButtonState.Up || this.released; }
    get changed() { return this.pressed || this.released; }

    /** Given a raw input signal (pressed/unpressed), update this button's state. */
    update(buttonDown: boolean) {
        this._framesStateHeld++;

        // Absolve single-frame states
        if (this.pressed) this._state = ButtonState.Down;
        if (this.released) this._state = ButtonState.Up;

        // Affect state if there's been a change
        if (this.up && buttonDown) {
            this._state = ButtonState.Pressed;
            this._framesStateHeld = 0;
        }
        if (this.down && !buttonDown) {
            this._state = ButtonState.Released;
            this._framesStateHeld = 0;
        }
    }

    /** Resets the button state; sets it to 'Up,' skipping 'Released,' basically. */
    reset() {
        this._state = ButtonState.Up;
    }

    /** Reconfigures this button's input-serial mapping for gamepads and keyboards. */
    remap(map: ButtonMap) {
        this.map = map;
    }
}