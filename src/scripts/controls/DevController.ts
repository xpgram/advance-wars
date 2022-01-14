import { StringDictionary } from "../CommonTypes";
import { Button } from "./Button";
import { ButtonMap } from "./ButtonMap";
import { KeyboardObserver, Keys } from "./KeyboardObserver";

type DevControllerEvent = {
  keyId: number,
  callback: Function,
  context?: object,
}

/**
 * An extension of the normal input management system which is intended exclusively for
 * development. Must be explicitly enabled for it to function and should not be in
 * production builds.
 * 
 * When enabled, allows any keyboard key recognized by KeyboardObserver to be
 * referenceable for state polling or some callback event.
 * 
 * @author Dei Valko
 */
export class DevController {

  /** Reference to the keyboard this controller is listening to. */
  static readonly keyboard = KeyboardObserver;

  /** Neutral button object assumed when DevController is disabled. */
  static readonly default_button = new Button(new ButtonMap(null, null, null, null));

  /** Whether this controller should observe and respond to keyboard events. */
  private enabled: boolean;

  /** Dictionary of keyboard keys and their states. */
  button: StringDictionary<Button> = {};

  /** Callbacks for on-press events. */
  private onPressEvents: DevControllerEvent[] = [];

  /** Callbacks for on-release events. */
  private onReleaseEvents: DevControllerEvent[] = [];

  /** Callbacks for while-down events. */
  private whileDownEvents: DevControllerEvent[] = [];

  constructor(options?: {enable?: boolean}) {
    this.enabled = options?.enable || false;
    const KeyMap = Keys as StringDictionary<number>;
    for (const key in KeyMap) {
      const keyVal = (this.enabled) ? KeyMap[key] : null;
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
    let button = Object.values(this.button).find( button => button.map.key1 === keyId );
    return (button !== undefined) ? button : DevController.default_button;
  }

  getKeyModifier(keyId: number, altMode?: 'Shift' | 'Ctrl' | 'Alt') {
    const button = this.get(keyId);
    let modifier: Button | undefined;
    if (altMode) {
      const modId = {'Shift': Keys.Shift, 'Ctrl': Keys.Ctrl, 'Alt': Keys.Alt}[altMode];
      modifier = Object.values(this.button).find( button => button.map.key1 === modId );
    }
    return {button, modifier};
  }

  // TODO C, Shift+C and Shift+Ctrl+C are distinct. Create a method getAltState()
  // which reflects the down/up state of all modifier keys.

  /** Returns true if the given keyId was pressed this frame.
   * If altMode is provided, only returns true given the keyId if the specified alt key is also down. */
  pressed(keyId: number, altMode?: 'Shift' | 'Ctrl' | 'Alt'): boolean {
    const { button, modifier } = this.getKeyModifier(keyId, altMode);
    return button.pressed && (!modifier || modifier.down);
  }

  /** Returns true if the given keyId is down this frame.
   * If altMode is provided, only returns true given the keyId if the specified alt key is also down. */
  down(keyId: number, altMode?: 'Shift' | 'Ctrl' | 'Alt'): boolean {
    const { button, modifier } = this.getKeyModifier(keyId, altMode);
    return button.down && (!modifier || modifier.down);
  }

  /** Updates the state of this virtual controller by polling the keyboard status. */
  update() {
    if (!this.enabled)
      return;

    for (const buttonProp in this.button) {
      const button = this.button[buttonProp];
      let down = false;

      // Record key status
      if (button.map.key1 != null)
        down = DevController.keyboard.keyDown(button.map.key1);

      button.update(down);

      // Handle event callbacks.
      if (button.pressed)
        this.handleEvents(this.onPressEvents.filter( event => event.keyId === button.map.key1 ));
      else if (button.released)
        this.handleEvents(this.onReleaseEvents.filter( event => event.keyId === button.map.key1 ));
      else if (button.down)
        this.handleEvents(this.whileDownEvents.filter( event => event.keyId === button.map.key1 ));
    }
  }

  /** Given a list of event callbacks, calls them with the provided context. */
  private handleEvents(events: DevControllerEvent[]): void {
    events.forEach( event => event.callback.call(event.context) );
  }

  /** Saves a function and context to the DevController's on-press event handler. */
  onPress(keyId: number, callback: Function, context?: object): void {
    if (this.enabled)
      this.onPressEvents.push({keyId, callback, context});
  }

  /** Saves a function and context to the DevController's on-release event handler. */
  onRelease(keyId: number, callback: Function, context?: object): void {
    if (this.enabled)
      this.onReleaseEvents.push({keyId, callback, context});
  }

  /** Saves a function and context to the DevController's while-down event handler.
   * There is no limiter in place; this callback will be called on every frame. */
  onDown(keyId: number, callback: Function, context?: object): void {
    if (this.enabled)
      this.whileDownEvents.push({keyId, callback, context});
  }

  /** Removes a callback from the events handler. */
  removeEvent(keyId: number, callback: Function, context?: object): void {
    function sameEvent(event: DevControllerEvent) {
      return (
        event.keyId === keyId
        && event.callback === callback
        && event.context === context
      );
    }
    this.onPressEvents = this.onPressEvents.filter( event => !sameEvent(event) );
    this.onReleaseEvents = this.onReleaseEvents.filter( event => !sameEvent(event) );
    this.whileDownEvents = this.whileDownEvents.filter( event => !sameEvent(event) );
  }
}