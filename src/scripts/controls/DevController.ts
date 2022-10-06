import { Button } from "./Button";
import { ButtonMap } from "./ButtonMap";
import { KeyboardObserver, Keys } from "./KeyboardObserver";

type PublicBuildOptions = {
  allowEndUser: boolean
}

/** A vault-style object designed to strictly regulate free-access to the keyboard state.
 * 
 * This prevents accidental dev-override of safety measures meant to restrict dev-only
 * functions in production builds by requiring all DevController requests to go through
 * this bottleneck.
 * 
 * Explicit overrides are still possible, but are forced to be labeled as such. */
class KeyLibrary {

  /** Whether to disable free-access to the keyboard state without an explicit request
   * to bypass these protections. */
  readonly productionLocked: boolean;

  /** Library of button objects for each keyboard key. */
  private readonly buttons: Record<string, Button> = {};

  
  constructor(locked = true) {
    this.productionLocked = locked;

    for (const key of Object.values(Keys)) {
      const buttonMap = new ButtonMap(null, null, key, null);
      this.buttons[key] = new Button(buttonMap);
    }
  }

  resetState() {
    for (const button of Object.values(this.buttons))
      button.reset();
  }

  pollKeyboard() {
    for (const button of Object.values(this.buttons)) {
      const down = (button.map.key1 !== null)
        ? KeyboardObserver.keyDown(button.map.key1)
        : false;
      button.update(down);
    }
  }

  /** Returns a Button object from the library of keys whose keycode corresponds to `keyId`.
   * If `keyId` is unmatchable, or if the production lock is in place and not explicitly
   * bypassed, the Button returned will be a nonfunctional default. */
  get(keyId: number, o?: PublicBuildOptions): Button {
    const accessEnabled = (!this.productionLocked || o?.allowEndUser);
    const nullButton = new Button(new ButtonMap(null, null, null, null));
    
    if (!accessEnabled)
      return nullButton;
    
    return this.buttons[keyId] ?? nullButton;
  }

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

  /** Vault for keyboard buttons which encourages safe dev-only input handling. */
  private readonly buttons: KeyLibrary;


  constructor(options?: {enable?: boolean}) {
    const libraryLocked = (options?.enable !== true);
    this.buttons = new KeyLibrary(libraryLocked);
  }

  /** Reset button state. */
  reset() {
    this.buttons.resetState();
  }

  /** Accessor method which returns a Button according to the Key value it's associated with.
   * Usage: devController.get(Keys.A), where Keys is the ID map obtained from KeyboardObserver. */
  getKey(keyId: number, lock?: PublicBuildOptions): Button {
    return this.buttons.get(keyId, lock);
  }

  /** Accessor method which extends this.get() to also return the associated alt-modifier button. */
  private getModifier(altMode?: 'Shift' | 'Ctrl' | 'Alt') {
    let modifier: Button | undefined;
    if (altMode) {
      const modId = {'Shift': Keys.Shift, 'Ctrl': Keys.Ctrl, 'Alt': Keys.Alt}[altMode];
      modifier = this.buttons.get(modId, {allowEndUser: true});
    }
    return modifier;
  }

  // TODO C, Shift+C and Shift+Ctrl+C are distinct. Create a method getAltState()
  // which reflects the down/up state of all modifier keys.

  /** Returns true if the given keyId was pressed this frame.
   * If altMode is provided, only returns true given the keyId if the specified alt key is also down. */
  pressed(keyId: number, altMode?: 'Shift' | 'Ctrl' | 'Alt', lock?: PublicBuildOptions): boolean {
    const button = this.getKey(keyId, lock);
    const modifier = this.getModifier(altMode);
    return button.pressed && (!modifier || modifier.down);
  }

  /** Returns true if the given keyId is down this frame.
   * If altMode is provided, only returns true given the keyId if the specified alt key is also down. */
  down(keyId: number, altMode?: 'Shift' | 'Ctrl' | 'Alt', lock?: PublicBuildOptions): boolean {
    const button = this.getKey(keyId, lock);
    const modifier = this.getModifier(altMode);
    return button.down && (!modifier || modifier.down);
  }

  /** Updates the state of this virtual controller by polling the keyboard status. */
  update() {
    this.buttons.pollKeyboard();
  }

}