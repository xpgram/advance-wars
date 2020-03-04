import { ButtonMap } from "./ButtonMap";
import { StringDictionary } from "../CommonTypes";

/** Represents a controller/keyboard control configuration. */
export type ButtonConfig = {
    DpadUp: ButtonMap;
    DpadDown: ButtonMap;
    DpadLeft: ButtonMap;
    DpadRight: ButtonMap;
    A: ButtonMap;
    B: ButtonMap;
    X: ButtonMap;
    Y: ButtonMap;
    LeftTrigger: ButtonMap;
    LeftBumper: ButtonMap;
    LeftStickButton: ButtonMap;
    RightTrigger: ButtonMap;
    RightBumper: ButtonMap;
    RightStickButton: ButtonMap;
    Select: ButtonMap;
    Start: ButtonMap;

    LeftStickVer: number;      // Axis index
    LeftStickHor: number;
    RightStickVer: number;
    RightStickHor: number;
}

// TODO Convert the integer literals given below to Controller.A, Controller.Start and Keys.X, Keys.Shift

/** Standard controller/keyboard mapping for Advance Wars. */
const StandardConfig: ButtonConfig = {
    A: new ButtonMap(0, null, 90, null),                // Z
    B: new ButtonMap(1, null, 88, null),                // X
    Y: new ButtonMap(2, null, 67, null),                // C
    X: new ButtonMap(3, null, 86, null),                // V
    LeftBumper: new ButtonMap(4, null, 17, null),       // Ctrl
    RightBumper: new ButtonMap(5, null, 32, null),      // Spacebar
    LeftTrigger: new ButtonMap(6, null, 16, null),      // Shift
    RightTrigger: new ButtonMap(7, null, null, null),
    Select: new ButtonMap(8, null, 66, null),           // B
    Start: new ButtonMap(9, null, 9, null),             // Tab
    LeftStickButton: new ButtonMap(10, null, null, null),
    RightStickButton: new ButtonMap(11, null, null, null),
    DpadUp: new ButtonMap(12, null, 38, null),          // ↑
    DpadDown: new ButtonMap(13, null, 40, null),        // ↓
    DpadLeft: new ButtonMap(14, null, 37, null),        // ←
    DpadRight: new ButtonMap(15, null, 39, null),       // →

    LeftStickHor: 0,
    LeftStickVer: 1,
    RightStickHor: 2,
    RightStickVer: 3
}

/** Same as StandardConfig, but swaps A and B. */
const SNESStyleConfig: ButtonConfig = {
    A: new ButtonMap(1, null, 90, null),                // Z
    B: new ButtonMap(0, null, 88, null),                // X
    Y: new ButtonMap(2, null, 67, null),                // C
    X: new ButtonMap(3, null, 86, null),                // V
    LeftBumper: new ButtonMap(4, null, 17, null),       // Ctrl
    RightBumper: new ButtonMap(5, null, 32, null),      // Spacebar
    LeftTrigger: new ButtonMap(6, null, 16, null),      // Shift
    RightTrigger: new ButtonMap(7, null, null, null),
    Select: new ButtonMap(8, null, 66, null),           // B
    Start: new ButtonMap(9, null, 9, null),             // Tab
    LeftStickButton: new ButtonMap(10, null, null, null),
    RightStickButton: new ButtonMap(11, null, null, null),
    DpadUp: new ButtonMap(12, null, 38, null),          // ↑
    DpadDown: new ButtonMap(13, null, 40, null),        // ↓
    DpadLeft: new ButtonMap(14, null, 37, null),        // ←
    DpadRight: new ButtonMap(15, null, 39, null),       // →

    LeftStickHor: 0,
    LeftStickVer: 1,
    RightStickHor: 2,
    RightStickVer: 3
}


export { StandardConfig, SNESStyleConfig };