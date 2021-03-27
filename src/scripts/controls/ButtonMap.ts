
/** Container class for button and keycode serials. */
export class ButtonMap {
    button1: number | null;
    button2: number | null;
    key1: number | null;
    key2: number | null;

    constructor(button1: number | null, button2: number | null, key1: number | null, key2: number | null) {
        this.button1 = button1;
        this.button2 = button2;
        this.key1 = key1;
        this.key2 = key2;
    }
}