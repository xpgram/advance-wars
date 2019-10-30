import { Button } from "./Button";
import { Point, StringDictionary } from "../CommonTypes";

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
        B: new Button('B', ButtonMap.B, null, null),        // Snes setup
        A: new Button('A', ButtonMap.A, null, null),
        Y: new Button('Y', ButtonMap.Y, null, null),
        X: new Button('X', ButtonMap.X, null, null),
        leftBumper: new Button('Left Bumper', ButtonMap.leftBumper, null, null),
        rightBumper: new Button('Right Bumper', ButtonMap.rightBumper, null, null),
        leftTrigger: new Button('Left Trigger', ButtonMap.leftTrigger, null, null),
        rightTrigger: new Button('Right Trigger', ButtonMap.rightTrigger, null, null),
        select: new Button('Select', ButtonMap.select, null, null),
        start: new Button('Start', ButtonMap.start, null, null),
        leftStick: new Button('Left Stick', ButtonMap.leftStick, null, null),
        rightStick: new Button('Right Stick', ButtonMap.rightStick, null, null),
        dpadUp: new Button('D-Pad Up', ButtonMap.dpadUp, null, null),
        dpadDown: new Button('D-Pad Down', ButtonMap.dpadDown, null, null),
        dpadLeft: new Button('D-Pad Left', ButtonMap.dpadLeft, null, null),
        dpadRight: new Button('D-Pad Right', ButtonMap.dpadRight, null, null)
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
                if (button.index)
                    button.update(gamepad.buttons[ button.index ].pressed);
                // else if (button.keycode)
                //     button.update(gamepad.keys[ button.keycode ].pressed);
                // ↑ Something sorta like this.
                // But also rewritten like this:
                //     button.update(button.pressed || key.pressed);
            }
        }
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