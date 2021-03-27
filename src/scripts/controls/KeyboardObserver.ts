import { Common } from "../CommonUtils";
import { NumericDictionary } from "../CommonTypes";

// Keeps track of all keycode pressed/unpressed boolean states in four 64-bit numbers.
const keys: NumericDictionary<number> = {
    0: 0,   // 0 to 63
    1: 0,   // 64 to 127
    2: 0,   // 128 to 191
    3: 0    // 161 to 255
}

// On key down, write 'true' (1) to the keycode index of keys.
window.addEventListener('keydown', (event) => {
    let key = event.keyCode;
    let keyset = Math.floor(key / 64);
    let keyindex = key % 64;
    keys[keyset] = Common.writeBits(keys[keyset], 1, 1, keyindex);
    event.preventDefault();         // TODO Is this applied to the entire window? It should only occur when the game div is focused.
});

// On key up, write 'false' (0) to the keycode index of keys.
window.addEventListener('keyup', (event) => {
    let key = event.keyCode;
    let keyset = Math.floor(key / 64);
    let keyindex = key % 64;
    keys[keyset] = Common.writeBits(keys[keyset], 0, 1, keyindex);
    event.preventDefault();
});

/** An observer object which relays keyboard key up/down state. */
export const KeyboardObserver = {
    /** Given a keycode, returns true if that key is down. */
    keyDown: (keycode: number): boolean => {
        let keyset = Math.floor(keycode / 64);
        let keyindex = keycode % 64;
        let n = Common.readBits(keys[keyset], 1, keyindex);
        return !!(n);   // Typecast to boolean.
    },

    /** Resets all state information to key-up only. */
    reset: () => {
        for (let i in keys)
            keys[i] = 0;
    }
}