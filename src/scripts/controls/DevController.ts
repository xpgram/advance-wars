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

  constructor(options?: {enable?: boolean}) {
    const KeyMap = Keys as StringDictionary<number>;
    for (const key in KeyMap) {
      const keyVal = (options?.enable) ? KeyMap[key] : null;
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

  /** Accessor method which returns a Button according to the Key value it's associated with.
   * Usage: devController.get(Keys.A), where Keys is the ID map obtained from KeyboardObserver. */
  get(keyId: number): Button {
    const button = Object.values(this.button).find( button => button.map.key1 === keyId );
    if (button === undefined)
      throw new Error(`Cannot access keyId ${keyId}: does not exist.`);
    return button;
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