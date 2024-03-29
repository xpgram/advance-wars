import { Button } from "./Button";
import { KeyboardObserver } from "./KeyboardObserver";
import { Axis2D } from "./Axis";
import { ButtonMap } from "./ButtonMap";
import { Point } from "../Common/Point";
import { Debug } from "../DebugUtils";
import { Game } from "../..";

/**
 * @author Dei Valko
 */
export class VirtualGamepad {
    static readonly keyboard = KeyboardObserver;

    /** Whether this virtual controller assumes input from the keyboard when its controller is disconnected. */
    defaultToKeyboard: boolean = false;

    /** Which 'controller port' this gamepad listens to for input. */
    readonly controllerPortNumber: number;
    
    /** A collection of this controller's axes. */
    readonly axis = {
        leftStick: new Axis2D('Left Stick'),
        rightStick: new Axis2D('Right Stick'),
        dpad: new Axis2D('D-Pad')
    }

    /** A collection of this controller's buttons. */
    readonly button = {
        B: new Button(new ButtonMap(DefaultControllerMap.B, null, DefaultKeyboardMap.X, null)),
        A: new Button(new ButtonMap(DefaultControllerMap.A, null, DefaultKeyboardMap.Z, null)),
        Y: new Button(new ButtonMap(DefaultControllerMap.Y, null, DefaultKeyboardMap.V, null)),
        X: new Button(new ButtonMap(DefaultControllerMap.X, null, DefaultKeyboardMap.C, null)),
        leftBumper: new Button(new ButtonMap(DefaultControllerMap.leftBumper, null, DefaultKeyboardMap.S, null)),
        rightBumper: new Button(new ButtonMap(DefaultControllerMap.rightBumper, null, DefaultKeyboardMap.D, null)),
        leftTrigger: new Button(new ButtonMap(DefaultControllerMap.leftTrigger, null, DefaultKeyboardMap.Ctrl, null)),
        rightTrigger: new Button(new ButtonMap(DefaultControllerMap.rightTrigger, null, DefaultKeyboardMap.Shift, null)),
        select: new Button(new ButtonMap(DefaultControllerMap.select, null, DefaultKeyboardMap.F, null)),
        start: new Button(new ButtonMap(DefaultControllerMap.start, null, DefaultKeyboardMap.A, null)),
        leftStick: new Button(new ButtonMap(DefaultControllerMap.leftStick, null, DefaultKeyboardMap.Comma, null)),
        rightStick: new Button(new ButtonMap(DefaultControllerMap.rightStick, null, DefaultKeyboardMap.Period, null)),
        dpadUp: new Button(new ButtonMap(DefaultControllerMap.dpadUp, null, DefaultKeyboardMap.UpArrow, null)),
        dpadDown: new Button(new ButtonMap(DefaultControllerMap.dpadDown, null, DefaultKeyboardMap.DownArrow, null)),
        dpadLeft: new Button(new ButtonMap(DefaultControllerMap.dpadLeft, null, DefaultKeyboardMap.LeftArrow, null)),
        dpadRight: new Button(new ButtonMap(DefaultControllerMap.dpadRight, null, DefaultKeyboardMap.RightArrow, null))
    };

    /** A list containing all four dpad button objects. */
    readonly dpadButtons = [
        this.button.dpadUp,
        this.button.dpadDown,
        this.button.dpadLeft,
        this.button.dpadRight,
    ];

    constructor(/*portNumber: number*/) {
        this.controllerPortNumber = 0;  // = portNumber;
        this.reset();
    }

    /** Reset button and stick state. */
    reset() {
        this.axis.leftStick.reset();
        this.axis.rightStick.reset();
        this.axis.dpad.reset();
        for (let button in this.button) {
            (this.button as Record<string, Button>)[button].reset();
        }
    }

    /** Updates the state of this virtual controller by polling a connected controller for its state. */
    update() {
        const gamepad = this.getNthGamepad(this.controllerPortNumber);

        // Update all virtual buttons
        for (const buttonProp in this.button) {
            const button = (this.button as Record<string, Button>)[buttonProp];
            let down = false; // False unless any of the button's mappable inputs can be considered 'down'

            // Prevent interaction while the game is not focused.
            if (!Game.hasFocus) {
                if (button.down)
                    button.update(false);
                continue;
            }

            // If either mapped gamepad button is down
            if (gamepad) {
                if (button.map.button1 != null)
                    down = gamepad.buttons[button.map.button1].pressed;
                if (button.map.button2 != null)
                    down = gamepad.buttons[button.map.button2].pressed || down;
            }
            // Or if either keyboard key is down
            if (button.map.key1 != null)
                down = VirtualGamepad.keyboard.keyDown(button.map.key1) || down;
            if (button.map.key2 != null)
                down = VirtualGamepad.keyboard.keyDown(button.map.key2) || down;

            button.update(down);
        }

        // Update D-Pad axis
        const y = (this.button.dpadDown.down ? 1 : 0) - (this.button.dpadUp.down ? 1 : 0);
        const x = (this.button.dpadRight.down ? 1 : 0) - (this.button.dpadLeft.down ? 1 : 0);
        this.axis.dpad.update(new Point(x,y));

        // Update axes
        if (gamepad) {
            if (gamepad.axes.length == 2) {
                const [lx, ly] = gamepad.axes;
                this.axis.leftStick.update(new Point(lx,ly));
            } else if (gamepad.axes.length >= 4) {
                const [lx, ly, rx, ry] = gamepad.axes;
                this.axis.leftStick.update(new Point(lx,ly));
                this.axis.rightStick.update(new Point(rx,ry));
            }
            // As of writing, browsers only support the gamepad 'Standard Layout'
            // If different controllers report axes in different ways, they're only
            // interpretted one way here.
            // I'm not even certain the first condition will ever evaluate to true.
        }
    }

    /** Gets the nth gamepad in the browser's list of connected gamepads, or returns
     * null if nth gamepad does not exist. */
    getNthGamepad(n: number): Gamepad | null {
        // Attempt to retrieve nth gamepad
        let i = 0;
        for (const gamepad of navigator.getGamepads()) {
            // Not all entries in 'gamepads' returned by navigator are real.
            if (gamepad && gamepad.mapping == "standard") {
                if (i == n)
                    return gamepad;
                i++;
            }
        }
        // Failed
        return null;
    }
}


// TODO Convert this silly enum into some kind of json script. Something loadable, configurable.
enum DefaultControllerMap {
    A = 0,
    B = 1,
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

// TODO Keys of KeyboardObserver.ts is more thicc, this is deprecated
// This should be converted to ButtonConfig at some point.
enum DefaultKeyboardMap {
    X = 88,
    Z = 90,
    V = 86,
    C = 67,
    Ctrl = 17,
    D = 68,
    Shift = 16,
    F = 70,
    A = 65,
    S = 83,
    Comma = 188,
    Period = 190,
    UpArrow = 38,
    DownArrow = 40,
    LeftArrow = 37,
    RightArrow = 39,
}