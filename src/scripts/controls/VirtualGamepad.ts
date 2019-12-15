import { Button } from "./Button";
import { StringDictionary } from "../CommonTypes";
import { KeyboardObserver } from "./KeyboardObserver";
import { Axis2D } from "./Axis";

/**
 * @author Dei Valko
 */
export class VirtualGamepad {
    static readonly keyboard = KeyboardObserver;

    /** Whether this virtual controller assumes input from the keyboard when its controller is disconnected. */
    defaultToKeyboard: boolean = false;
    
    /** A collection of this controller's axes. */
    readonly axis = {
        leftStick: new Axis2D('Left Stick'),
        rightStick: new Axis2D('Right Stick'),
        dpad: new Axis2D('D-Pad')
    }

    /** A collection of this controller's buttons. */
    button = {
        B: new Button('B', ButtonMap.B, 'X', 88),        // Snes setup
        A: new Button('A', ButtonMap.A, 'Z', 90),
        Y: new Button('Y', ButtonMap.Y, 'V', 86),
        X: new Button('X', ButtonMap.X, 'C', 67),
        leftBumper: new Button('Left Bumper', ButtonMap.leftBumper, 'Ctrl', 17),
        rightBumper: new Button('Right Bumper', ButtonMap.rightBumper, 'D', 68),
        leftTrigger: new Button('Left Trigger', ButtonMap.leftTrigger, 'Shift', 16),
        rightTrigger: new Button('Right Trigger', ButtonMap.rightTrigger, 'F', 70),
        select: new Button('Select', ButtonMap.select, 'A', 65),
        start: new Button('Start', ButtonMap.start, 'S', 83),
        leftStick: new Button('Left Stick', ButtonMap.leftStick, null, null),
        rightStick: new Button('Right Stick', ButtonMap.rightStick, null, null),
        dpadUp: new Button('D-Pad Up', ButtonMap.dpadUp, 'Up Arrow', 38),
        dpadDown: new Button('D-Pad Down', ButtonMap.dpadDown, 'Down Arrow', 40),
        dpadLeft: new Button('D-Pad Left', ButtonMap.dpadLeft, 'Left Arrow', 37),
        dpadRight: new Button('D-Pad Right', ButtonMap.dpadRight, 'Right ARrow', 39)
    };

    constructor() {
        this.reset();
    }

    /** Reset button and stick state. */
    reset() {
        this.axis.leftStick.reset();
        this.axis.rightStick.reset();
        this.axis.dpad.reset();
        for (let button in this.button) {
            (this.button as StringDictionary<Button>)[button].reset();
        }
    }

    /** Updates the state of this virtual controller by polling a connected controller for its state. */
    update() {
        let gamepad = this.getFirstGamepad();

        for (let buttonProp in this.button) {
            let button = (this.button as StringDictionary<Button>)[buttonProp];
            let pressed = false;
            if (gamepad)
                if (button.index)
                    pressed = gamepad.buttons[button.index].pressed;
            if (button.keycode)
                pressed = VirtualGamepad.keyboard.keyDown(button.keycode) || pressed;
            button.update(pressed);

            // TODO Sort out desired behavior: gamepad vs keyboard when both are enabled.

            // else if (button.keycode)
            //     button.update(gamepad.keys[ button.keycode ].pressed);
            // ↑ Something sorta like this.
            // But also rewritten like this:
            //     button.update(button.pressed || key.pressed);
        }

        // Update D-Pad
        let y = (this.button.dpadDown.down ? 1 : 0) - (this.button.dpadUp.down ? 1 : 0);
        let x = (this.button.dpadRight.down ? 1 : 0) - (this.button.dpadLeft.down ? 1 : 0);
        this.axis.dpad.update( {x:x, y:y} );

        // Update axes
        // ...
        // TODO How do I reference gamepad axes again?
    }

    // TODO Multiplayer? How do I generalize this? Controller's supposedly have IDs...
    // connectedGamepad: string; should be the ID of whichever controller we were listening to.
    // If this connection breaks, pick a new controller (.?)
    // What if we pick one already picked? We should keep a list somewhere.
    // If none are available, use the keyboard.
    // If the keyboard is banned, complain. (Should more-or-less trigger a "Please reconnect controller" message.)
    /** Gets the first gamepad in the browser's list of connected gamepads. */
    getFirstGamepad(): Gamepad | null {
        for (const gamepad of navigator.getGamepads()) if (gamepad) return gamepad;
        return null;
    }
}


// TODO Convert this silly enum into some kind of json script. Something loadable, configurable.
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