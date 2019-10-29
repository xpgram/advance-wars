import { Point, StringDictionary } from "./CommonTypes";

/**
 * @author Dei Valko
 */
export class VirtualGamepad {

    /** Whether this virtual controller assumes input from the keyboard when its controller is disconnected. */
    defaultToKeyboard: boolean = false;

    leftStick: Point = {x: 0, y: 0};
    rightStrick: Point = {x: 0, y: 0};
    
    get dpadAxis(): Point {
        // Axes directions are written mimic the gameworld: +x →, +y ↓
        let y = (this.button.dpadDown.down ? 1 : 0) - (this.button.dpadUp.down ? 1 : 0);
        let x = (this.button.dpadRight.down ? 1 : 0) - (this.button.dpadLeft.down ? 1 : 0);
        return {x:x, y:y};
    }

    get dpadDown(): boolean {
        let p = this.dpadAxis;
        return (p.x != 0 || p.y != 0);
    }

    button = {
        B: new Button('B', ButtonMap.B),        // Snes setup
        A: new Button('A', ButtonMap.A),
        Y: new Button('Y', ButtonMap.Y),
        X: new Button('X', ButtonMap.X),
        leftBumper: new Button('Left Bumper', ButtonMap.leftBumper),
        rightBumper: new Button('Right Bumper', ButtonMap.rightBumper),
        leftTrigger: new Button('Left Trigger', ButtonMap.leftTrigger),
        rightTrigger: new Button('Right Trigger', ButtonMap.rightTrigger),
        select: new Button('Select', ButtonMap.select),
        start: new Button('Start', ButtonMap.start),
        leftStick: new Button('Left Stick', ButtonMap.leftStick),
        rightStick: new Button('Right Stick', ButtonMap.rightStick),
        dpadUp: new Button('D-Pad Up', ButtonMap.dpadUp),
        dpadDown: new Button('D-Pad Down', ButtonMap.dpadDown),
        dpadLeft: new Button('D-Pad Left', ButtonMap.dpadLeft),
        dpadRight: new Button('D-Pad Right', ButtonMap.dpadRight)
    };

    constructor() {
        this.reset();

        // TODO Move this to class 'KeyboardListener' and add to virtual gamepad as a static property.
        window.addEventListener('keydown', (event) => {
            if (event.defaultPrevented)
                return;

            switch (event.key) {
                case "ArrowDown":
                    this.button.dpadDown.update(true);
                    break;
                case "ArrowUp":
                    this.button.dpadUp.update(true);
                    break;
                case "ArrowLeft":
                    this.button.dpadLeft.update(true);
                    break;
                case "ArrowRight":
                    this.button.dpadRight.update(true);
                    break;
                default:
                    return; // Quit when this doesn't handle the key event.
            }
        });
    }

    /** Reset button and stick state. */
    reset() {
        this.leftStick = {x: 0, y: 0};
        this.rightStrick = {x: 0, y: 0};
        for (let button in this.button) {
            (this.button as StringDictionary<Button>)[button].reset();
        }
    }

    /** Updates the state of this virtual controller by polling a connected controller for its state. */
    update() {
        let gamepad = this.getFirstGamepad();
        if (gamepad) {
            for (let buttonProp in this.button) {
                let button = (this.button as StringDictionary<Button>)[buttonProp];
                button.update(gamepad.buttons[ button.index ].pressed);
            }
        }
    }

    // TODO Multiplayer? How do I genericize this? Controller's supposedly have IDs...
    // connectedGamepad: string; should be the ID of whichever controller we were listening to.
    // If this connection breaks... I just don't know what to do then.
    /** Gets the first gamepad in the browser's list of connected gamepads. */
    getFirstGamepad(): Gamepad | null {
        for (const gamepad of navigator.getGamepads()) if (gamepad) return gamepad;
        return null;
    }
}

enum ButtonMap {
    B = 0,
    A = 1,
    Y = 2,
    X,
    leftBumper,
    rightBumper,
    leftTrigger,
    rightTrigger,
    select,
    start,
    leftStick,
    rightStick,
    dpadUp,
    dpadDown,
    dpadLeft,
    dpadRight
}

/** For use by Button only, pretty much. */
enum ButtonState {
    Up,
    Pressed,
    Down,
    Released
}

/** Describes a single button on the virtual controller. Self-manages pressed/down/released state. */
class Button {
    private _name: string;
    private _index: number;
    private _state: ButtonState;
    
    constructor(name: string, index: number) {
        this._name = name;
        this._index = index;
        this._state = ButtonState.Up;
    }

    get name() { return this._name; }
    get index() { return this._index; }

    get pressed() { return this._state == ButtonState.Pressed; }
    get down() { return this._state == ButtonState.Down || this.pressed; }
    get released() { return this._state == ButtonState.Released; }
    get up() { return this._state == ButtonState.Up || this.released; }

    /** Given the pressed/unpressed state of this button in buttonDown, update this button's state. */
    update(buttonDown: boolean) {
        if (this.up && buttonDown)
            this._state = ButtonState.Pressed;
        else if (this.pressed && buttonDown)
            this._state = ButtonState.Down;
        else if (this.down && !buttonDown)
            this._state = ButtonState.Released;
        else if (this.released && !buttonDown)
            this._state = ButtonState.Up;
    }

    /** Resets the button state; sets it to 'Up,' skipping 'Released,' basically. */
    reset() {
        this._state = ButtonState.Up;
    }
}