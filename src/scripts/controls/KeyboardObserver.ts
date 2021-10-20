import { Common } from "../CommonUtils";
import { NumericDictionary, StringDictionary } from "../CommonTypes";
import { Game } from "../..";

// Keeps track of all keycode pressed/unpressed boolean states in four 64-bit numbers.
// Keycodes are not different, this script is a convenient proxy between the browser and the game.
const keypressMatrix: NumericDictionary<number> = {
    0: 0,   // 0 to 63
    1: 0,   // 64 to 127
    2: 0,   // 128 to 191
    3: 0    // 161 to 255
}

// Returns true if the keyboard event should be ignored.
function refuseListen(event: KeyboardEvent): boolean {
    const notFocused = (document.activeElement !== Game.contextElement);
    const specialKey = (event.keyCode === Keys.Tab);    // Tab is important for non-mouse context switching.
    return notFocused || specialKey;
}

// On key down, write 'true' (1) to the keycode index of keys.
window.addEventListener('keydown', (event) => {
    if (refuseListen(event))
        return;

    let key = event.keyCode;
    let keyset = Math.floor(key / 64);
    let keyindex = key % 64;
    keypressMatrix[keyset] = Common.writeBits(keypressMatrix[keyset], 1, 1, keyindex);
    event.preventDefault();
});

// On key up, write 'false' (0) to the keycode index of keys.
window.addEventListener('keyup', (event) => {
    if (refuseListen(event))
        return;

    let key = event.keyCode;
    let keyset = Math.floor(key / 64);
    let keyindex = key % 64;
    keypressMatrix[keyset] = Common.writeBits(keypressMatrix[keyset], 0, 1, keyindex);
    event.preventDefault();
});

/** An observer object which relays keyboard key up/down state. */
export const KeyboardObserver = {
    /** Given a keycode, returns true if that key is down. */
    keyDown: (keycode: number): boolean => {
        let keyset = Math.floor(keycode / 64);
        let keyindex = keycode % 64;
        let n = Common.readBits(keypressMatrix[keyset], 1, keyindex);
        return (n == 1);
    },

    /** Resets all state information to key-up only. */
    reset: () => {
        for (let i in keypressMatrix)
            keypressMatrix[i] = 0;
    }
}

/** A dictionary of all standard keyboard keys and their keycodes.
 * Be aware that it is not strictly true that all browsers share all keycodes in this list,
 * though most of them do. */
export const Keys = {
    Backspace: 8,
    Tab: 9,
    Enter: 13,
    Shift: 16,
    Ctrl: 17,
    Alt: 18,
    PauseBreak: 19,
    CapsLock: 20,
    Escape: 27,
    Space: 32,
    PageUp: 33,
    PageDown: 34,
    End: 35,
    Home: 36,
    LeftArrow: 37,
    UpArrow: 38,
    RightArrow: 39,
    DownArrow: 40,
    Insert: 45,
    Delete: 46,
    iRow0: 48,
    iRow1: 49,
    iRow2: 50,
    iRow3: 51,
    iRow4: 52,
    iRow5: 53,
    iRow6: 54,
    iRow7: 55,
    iRow8: 56,
    iRow9: 57,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    LeftWindowKey: 91,
    RightWindowKey: 92,
    SelectKey: 93,
    Numpad0: 96,
    Numpad1: 97,
    Numpad2: 98,
    Numpad3: 99,
    Numpad4: 100,
    Numpad5: 101,
    Numpad6: 102,
    Numpad7: 103,
    Numpad8: 104,
    Numpad9: 105,
    Multiply: 106,
    Add: 107,
    Subtract: 109,
    DecimalPoint: 110,
    Divide: 111,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    NumLock: 144,
    ScrollLock: 145,
    Semicolon: 186,
    EqualSign: 187,
    Comma: 188,
    Dash: 189,
    Period: 190,
    ForwardSlash: 191,
    GraveAccent: 192,
    OpenBracket: 219,
    BackSlash: 220,
    CloseBraket: 221,
    SingleQuote: 222
}