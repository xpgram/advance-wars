import { ButtonState } from "./ButtonState";

/** Describes a single button on the virtual controller. Self-manages pressed/down/released state. */
export class Button {
    private _name: string | null;
    private _index: number | null;
    private _key: string | null;
    private _keycode: number | null;

    private _state: ButtonState;
    
    constructor(name: string | null, index: number | null, key: string | null, keycode: number | null) {
        this._name = name;
        this._index = index;
        this._key = key;
        this._keycode = keycode;

        this._state = ButtonState.Up;
    }

    get name() { return this._name; }
    get index() { return this._index; }

    get key() { return this._key; }
    get keycode() { return this._keycode; }

    get pressed() { return this._state == ButtonState.Pressed; }
    get down() { return this._state == ButtonState.Down || this.pressed; }
    get released() { return this._state == ButtonState.Released; }
    get up() { return this._state == ButtonState.Up || this.released; }

    /** Given the pressed/unpressed state of this button in buttonDown, update this button's state. */
    update(buttonDown: boolean) {
        // Absolve single-frame states
        if (this.pressed) this._state = ButtonState.Down;
        if (this.released) this._state = ButtonState.Up;

        // Affect state if there's been a change
        if (this.up && buttonDown)
            this._state = ButtonState.Pressed;
        if (this.down && !buttonDown)
            this._state = ButtonState.Released;
    }

    /** Resets the button state; sets it to 'Up,' skipping 'Released,' basically. */
    reset() {
        this._state = ButtonState.Up;
    }

    /** Returns true if this button has been assigned an input, false if not. */
    get isAssigned() { return (this._index || this._keycode); }
}