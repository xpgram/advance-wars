
// TODO Implement
// This is a variant of VirtualGamepad. Probably can't inherit, though.
// Assumes all Keys as buttons; use Object.keys(Keys) to build.
// Must be explicitly enabled during construction. (Game will not enable during a production build.)

import { StringDictionary } from "../CommonTypes";
import { Button } from "./Button";
import { ButtonMap } from "./ButtonMap";
import { KeyboardObserver, Keys } from "./KeyboardObserver";

/**
 * @author Dei Valko
 */
export class DevController {

  /** Reference to the keyboard this controller is listening to. */
  static readonly keyboard = KeyboardObserver;

  /** Dictionary of keyboard keys and their states. */
  button: StringDictionary<Button> = {};

  constructor(enabled?: boolean) {
    const KeyMap = Keys as StringDictionary<number>;
    for (const key in KeyMap) {
      const keyVal = (enabled) ? KeyMap[key] : null;
      const buttonMap = new ButtonMap(null, null, keyVal, null);
      this.button[key] = new Button(buttonMap);
    }
    this.reset();
  }

  /** Reset button state. */
  reset() {
    for (const button in this.button) {
        (this.button as StringDictionary<Button>)[button].reset();
    }
  }

  /** Updates the state of this virtual controller by polling the keyboard status. */
  update() {
    // TODO I don't think Button actually does the watching.
    for (const buttonProp in this.button) {
      const button = this.button[buttonProp];
      let down = false;

      // Record key status
      if (button.map.key1 != null)
        down = DevController.keyboard.keyDown(button.map.key1);

      button.update(down);
    }
  }
}